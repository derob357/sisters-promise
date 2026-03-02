const { v4: uuidv4 } = require('uuid');
const BlogPost = require('../models/BlogPost');

class BlogService {
  static cache = {
    featuredPosts: null,
    publishedPosts: null,
    lastUpdate: null
  };

  static async refreshCache() {
    try {
      this.cache.featuredPosts = await this._getFeaturedPostsFromDb(4);
      this.cache.publishedPosts = await this._getPublishedPostsFromDb(1, 9, 'newest');
      this.cache.lastUpdate = new Date();
      console.log(`[BlogService] Cache refreshed at ${this.cache.lastUpdate.toISOString()}`);
    } catch (error) {
      console.error('[BlogService] Error refreshing cache:', error);
    }
  }

  static startScheduledUpdates() {
    const cron = require('node-cron');
    // Run at midnight, 5am, noon, and 6pm
    cron.schedule('0 0,5,12,18 * * *', async () => {
      console.log('[BlogService] Running scheduled cache refresh...');
      await this.refreshCache();
    });
    // Run an initial refresh
    this.refreshCache();
  }

  static generateSlug(title) {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);
    return base + '-' + uuidv4().slice(0, 8);
  }

  static async createPost(postData, author) {
    if (!postData.title || !postData.content) {
      throw new Error('Title and content are required');
    }

    const post = new BlogPost({
      id: uuidv4(),
      title: postData.title,
      slug: this.generateSlug(postData.title),
      content: postData.content,
      excerpt: postData.excerpt || postData.content.replace(/<[^>]*>/g, '').slice(0, 200),
      coverImage: postData.coverImage || '',
      author: {
        userId: author.userId,
        userName: author.userName,
        userRole: author.userRole
      },
      tags: postData.tags || [],
      category: postData.category || '',
      isPublished: postData.isPublished || false,
      publishedAt: postData.isPublished ? new Date() : null,
      isFeatured: postData.isFeatured || false,
    });

    await post.save();
    this.refreshCache().catch(e => console.error('[BlogService] Error refreshing cache after create:', e));
    return post;
  }

  static async updatePost(postId, updateData) {
    const post = await BlogPost.findOne({ id: postId, isDeleted: false });
    if (!post) throw new Error('Post not found');

    const allowedFields = ['title', 'content', 'excerpt', 'coverImage', 'tags', 'category', 'isPublished', 'isFeatured'];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        post[field] = updateData[field];
      }
    }

    if (updateData.title) {
      post.slug = this.generateSlug(updateData.title);
    }

    if (updateData.isPublished && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    this.refreshCache().catch(e => console.error('[BlogService] Error refreshing cache after update:', e));
    return post;
  }

  static async deletePost(postId, deleterId) {
    const post = await BlogPost.findOne({ id: postId, isDeleted: false });
    if (!post) throw new Error('Post not found');

    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = deleterId;
    await post.save();
    this.refreshCache().catch(e => console.error('[BlogService] Error refreshing cache after delete:', e));
    return { success: true };
  }

  static async getPublishedPosts(page = 1, limit = 10, sort = 'newest') {
    // Return from cache if it's the exact match for homepage/default list
    if (page === 1 && limit === 9 && sort === 'newest') {
      if (!this.cache.publishedPosts) {
        await this.refreshCache();
      }
      return this.cache.publishedPosts;
    }
    return this._getPublishedPostsFromDb(page, limit, sort);
  }

  static async _getPublishedPostsFromDb(page = 1, limit = 10, sort = 'newest') {
    const filter = { isPublished: true, isDeleted: false };

    let sortOption;
    switch (sort) {
      case 'popular': sortOption = { score: -1, publishedAt: -1 }; break;
      case 'most_commented': sortOption = { commentCount: -1, publishedAt: -1 }; break;
      default: sortOption = { publishedAt: -1 };
    }

    const skip = (page - 1) * limit;
    const total = await BlogPost.countDocuments(filter);
    const posts = await BlogPost.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select('-content -comments -votes')
      .lean();

    return {
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getFeaturedPosts(limit = 4) {
    if (limit === 4) {
      if (!this.cache.featuredPosts) {
        await this.refreshCache();
      }
      return this.cache.featuredPosts;
    }
    return this._getFeaturedPostsFromDb(limit);
  }

  static async _getFeaturedPostsFromDb(limit = 4) {
    let posts = await BlogPost.find({
      isFeatured: true,
      isPublished: true,
      isDeleted: false
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('-content -comments -votes')
      .lean();

    // Fall back to latest published if not enough featured
    if (posts.length < limit) {
      const existingIds = posts.map(p => p.id);
      const more = await BlogPost.find({
        isPublished: true,
        isDeleted: false,
        id: { $nin: existingIds }
      })
        .sort({ publishedAt: -1 })
        .limit(limit - posts.length)
        .select('-content -comments -votes')
        .lean();
      posts = posts.concat(more);
    }

    return posts;
  }

  static async getPostBySlug(slug) {
    const post = await BlogPost.findOneAndUpdate(
      { slug, isPublished: true, isDeleted: false },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!post) return null;

    // Filter deleted comments
    if (post.comments) {
      post.comments = post.comments.filter(c => !c.isDeleted);
    }

    return post;
  }

  static async voteOnPost(postId, userId, voteType) {
    if (!['up', 'down'].includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    const post = await BlogPost.findOne({ id: postId, isPublished: true, isDeleted: false });
    if (!post) throw new Error('Post not found');

    const existingIdx = post.votes.findIndex(v => v.userId === userId);

    if (existingIdx !== -1) {
      if (post.votes[existingIdx].voteType === voteType) {
        post.votes.splice(existingIdx, 1);
      } else {
        post.votes[existingIdx].voteType = voteType;
        post.votes[existingIdx].votedAt = new Date();
      }
    } else {
      post.votes.push({ userId, voteType, votedAt: new Date() });
    }

    post.score = post.votes.reduce((sum, v) => sum + (v.voteType === 'up' ? 1 : -1), 0);
    await post.save();

    const userVote = post.votes.find(v => v.userId === userId);
    return { score: post.score, userVote: userVote ? userVote.voteType : null };
  }

  static async voteOnComment(postId, commentId, userId, voteType) {
    if (!['up', 'down'].includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    const post = await BlogPost.findOne({ id: postId, isDeleted: false });
    if (!post) throw new Error('Post not found');

    const comment = post.comments.find(c => c.id === commentId && !c.isDeleted);
    if (!comment) throw new Error('Comment not found');

    const existingIdx = comment.votes.findIndex(v => v.userId === userId);

    if (existingIdx !== -1) {
      if (comment.votes[existingIdx].voteType === voteType) {
        comment.votes.splice(existingIdx, 1);
      } else {
        comment.votes[existingIdx].voteType = voteType;
        comment.votes[existingIdx].votedAt = new Date();
      }
    } else {
      comment.votes.push({ userId, voteType, votedAt: new Date() });
    }

    comment.score = comment.votes.reduce((sum, v) => sum + (v.voteType === 'up' ? 1 : -1), 0);
    await post.save();

    const userVote = comment.votes.find(v => v.userId === userId);
    return { score: comment.score, userVote: userVote ? userVote.voteType : null };
  }

  static async addComment(postId, userId, userName, userRole, content) {
    if (!content || !content.trim()) {
      throw new Error('Comment content is required');
    }
    if (content.length > 5000) {
      throw new Error('Comment must be 5000 characters or less');
    }

    const post = await BlogPost.findOne({ id: postId, isPublished: true, isDeleted: false });
    if (!post) throw new Error('Post not found');

    const comment = {
      id: uuidv4(),
      userId,
      userName,
      userRole,
      content: content.trim(),
      votes: [],
      score: 0,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    post.comments.push(comment);
    post.commentCount = post.comments.filter(c => !c.isDeleted).length;
    await post.save();

    return comment;
  }

  static async deleteComment(postId, commentId, userId, userRole) {
    const post = await BlogPost.findOne({ id: postId, isDeleted: false });
    if (!post) throw new Error('Post not found');

    const comment = post.comments.find(c => c.id === commentId && !c.isDeleted);
    if (!comment) throw new Error('Comment not found');

    // Only comment author, post author, admin, or owner can delete
    const canDelete = comment.userId === userId ||
      post.author.userId === userId ||
      ['admin', 'owner'].includes(userRole);

    if (!canDelete) {
      throw new Error('Not authorized to delete this comment');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.deletedBy = userId;
    post.commentCount = post.comments.filter(c => !c.isDeleted).length;
    await post.save();

    return { success: true };
  }
}

module.exports = BlogService;
