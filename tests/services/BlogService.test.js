/**
 * BlogService Tests
 */
jest.mock('../../models/BlogPost');
const BlogPost = require('../../models/BlogPost');
const BlogService = require('../../services/BlogService');

// Helper: create a mock post object with save method
const createMockPost = (overrides = {}) => ({
  id: 'test-post-id',
  title: 'Test Post',
  slug: 'test-post-abc123',
  content: '<p>Test content</p>',
  excerpt: 'Test content',
  coverImage: '',
  author: { userId: 'author-1', userName: 'Admin', userRole: 'admin' },
  tags: [],
  category: '',
  votes: [],
  score: 0,
  comments: [],
  commentCount: 0,
  viewCount: 0,
  isPublished: true,
  publishedAt: new Date('2026-01-01'),
  isFeatured: false,
  isDeleted: false,
  save: jest.fn().mockResolvedValue(true),
  ...overrides
});

describe('BlogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should lowercase and hyphenate title', () => {
      const slug = BlogService.generateSlug('My First Blog Post');
      expect(slug).toMatch(/^my-first-blog-post-[a-f0-9]{8}$/);
    });

    it('should strip special characters', () => {
      const slug = BlogService.generateSlug('Hello! @World #2026');
      expect(slug).toMatch(/^hello-world-2026-[a-f0-9]{8}$/);
    });

    it('should truncate to 100 characters plus uuid suffix', () => {
      const longTitle = 'a'.repeat(200);
      const slug = BlogService.generateSlug(longTitle);
      // 100 chars base + '-' + 8 char uuid = 109
      expect(slug.length).toBeLessThanOrEqual(109);
    });

    it('should handle empty string', () => {
      const slug = BlogService.generateSlug('');
      expect(slug).toMatch(/^-[a-f0-9]{8}$/);
    });
  });

  describe('createPost', () => {
    it('should throw if title is missing', async () => {
      await expect(BlogService.createPost({ content: 'text' }, {}))
        .rejects.toThrow('Title and content are required');
    });

    it('should throw if content is missing', async () => {
      await expect(BlogService.createPost({ title: 'Title' }, {}))
        .rejects.toThrow('Title and content are required');
    });

    it('should create post with generated id and slug', async () => {
      BlogPost.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
      });

      const result = await BlogService.createPost(
        { title: 'Test Post', content: '<p>Hello</p>' },
        { userId: 'user-1', userName: 'Admin', userRole: 'admin' }
      );

      expect(result.id).toBeDefined();
      expect(result.slug).toMatch(/^test-post-/);
      expect(result.author.userId).toBe('user-1');
      expect(result.save).toHaveBeenCalled();
    });

    it('should set isPublished to false by default', async () => {
      BlogPost.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
      });

      const result = await BlogService.createPost(
        { title: 'Draft', content: 'text' },
        { userId: 'u1', userName: 'A', userRole: 'admin' }
      );

      expect(result.isPublished).toBe(false);
    });

    it('should auto-generate excerpt from content if not provided', async () => {
      BlogPost.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
      });

      const result = await BlogService.createPost(
        { title: 'Test', content: '<p>Hello World</p>' },
        { userId: 'u1', userName: 'A', userRole: 'admin' }
      );

      expect(result.excerpt).toBe('Hello World');
    });
  });

  describe('updatePost', () => {
    it('should throw if post not found', async () => {
      BlogPost.findOne = jest.fn().mockResolvedValue(null);

      await expect(BlogService.updatePost('missing', { title: 'New' }))
        .rejects.toThrow('Post not found');
    });

    it('should update allowed fields only', async () => {
      const mockPost = createMockPost();
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      await BlogService.updatePost('test-post-id', {
        title: 'Updated Title',
        content: 'Updated content',
        category: 'skincare',
        id: 'hacked-id', // should NOT be updated
      });

      expect(mockPost.title).toBe('Updated Title');
      expect(mockPost.content).toBe('Updated content');
      expect(mockPost.category).toBe('skincare');
      expect(mockPost.id).toBe('test-post-id'); // unchanged
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should regenerate slug when title changes', async () => {
      const mockPost = createMockPost({ slug: 'old-slug-12345678' });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      await BlogService.updatePost('test-post-id', { title: 'New Title' });

      expect(mockPost.slug).toMatch(/^new-title-[a-f0-9]{8}$/);
    });

    it('should set publishedAt when isPublished changes to true', async () => {
      const mockPost = createMockPost({ isPublished: false, publishedAt: null });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      await BlogService.updatePost('test-post-id', { isPublished: true });

      expect(mockPost.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('deletePost', () => {
    it('should throw if post not found', async () => {
      BlogPost.findOne = jest.fn().mockResolvedValue(null);

      await expect(BlogService.deletePost('missing', 'user-1'))
        .rejects.toThrow('Post not found');
    });

    it('should soft delete with deletedAt and deletedBy', async () => {
      const mockPost = createMockPost();
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.deletePost('test-post-id', 'admin-1');

      expect(mockPost.isDeleted).toBe(true);
      expect(mockPost.deletedBy).toBe('admin-1');
      expect(mockPost.deletedAt).toBeInstanceOf(Date);
      expect(result.success).toBe(true);
    });
  });

  describe('getPublishedPosts', () => {
    it('should return paginated results', async () => {
      const mockPosts = [createMockPost(), createMockPost({ id: 'post-2' })];
      BlogPost.countDocuments = jest.fn().mockResolvedValue(20);
      BlogPost.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockPosts)
              })
            })
          })
        })
      });

      const result = await BlogService.getPublishedPosts(2, 10, 'newest');

      expect(result.posts).toHaveLength(2);
      expect(result.pagination.total).toBe(20);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pages).toBe(2);
      expect(BlogPost.find).toHaveBeenCalledWith({ isPublished: true, isDeleted: false });
    });

    it('should sort by score for popular', async () => {
      BlogPost.countDocuments = jest.fn().mockResolvedValue(0);
      const sortMock = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      BlogPost.find = jest.fn().mockReturnValue({ sort: sortMock });

      await BlogService.getPublishedPosts(1, 10, 'popular');

      expect(sortMock).toHaveBeenCalledWith({ score: -1, publishedAt: -1 });
    });
  });

  describe('getFeaturedPosts', () => {
    it('should return featured published posts', async () => {
      const mockPosts = [createMockPost({ isFeatured: true })];
      BlogPost.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockPosts)
            })
          })
        })
      });

      const result = await BlogService.getFeaturedPosts(4);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should fallback to latest when fewer than limit featured', async () => {
      const featured = [createMockPost({ id: 'f1', isFeatured: true })];
      const latest = [createMockPost({ id: 'l1' }), createMockPost({ id: 'l2' })];

      let callCount = 0;
      BlogPost.find = jest.fn().mockImplementation(() => {
        callCount++;
        const data = callCount === 1 ? featured : latest;
        return {
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(data)
              })
            })
          })
        };
      });

      const result = await BlogService.getFeaturedPosts(4);

      expect(result).toHaveLength(3); // 1 featured + 2 fallback
      expect(BlogPost.find).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPostBySlug', () => {
    it('should return null if post not found', async () => {
      BlogPost.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      const result = await BlogService.getPostBySlug('no-such-slug');
      expect(result).toBeNull();
    });

    it('should filter deleted comments', async () => {
      const post = createMockPost({
        comments: [
          { id: 'c1', isDeleted: false, content: 'visible' },
          { id: 'c2', isDeleted: true, content: 'deleted' }
        ]
      });
      BlogPost.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(post)
      });

      const result = await BlogService.getPostBySlug('test-slug');

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].id).toBe('c1');
    });
  });

  describe('voteOnPost', () => {
    it('should add new upvote and recalculate score', async () => {
      const mockPost = createMockPost({ votes: [] });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.voteOnPost('test-post-id', 'user-1', 'up');

      expect(result.score).toBe(1);
      expect(result.userVote).toBe('up');
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should add new downvote and recalculate score', async () => {
      const mockPost = createMockPost({ votes: [] });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.voteOnPost('test-post-id', 'user-1', 'down');

      expect(result.score).toBe(-1);
      expect(result.userVote).toBe('down');
    });

    it('should toggle off when same vote type exists', async () => {
      const mockPost = createMockPost({
        votes: [{ userId: 'user-1', voteType: 'up', votedAt: new Date() }]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.voteOnPost('test-post-id', 'user-1', 'up');

      expect(result.score).toBe(0);
      expect(result.userVote).toBeNull();
    });

    it('should change direction when opposite vote exists', async () => {
      const mockPost = createMockPost({
        votes: [{ userId: 'user-1', voteType: 'up', votedAt: new Date() }]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.voteOnPost('test-post-id', 'user-1', 'down');

      expect(result.score).toBe(-1);
      expect(result.userVote).toBe('down');
    });

    it('should correctly calculate score with mixed votes', async () => {
      const mockPost = createMockPost({
        votes: [
          { userId: 'u1', voteType: 'up', votedAt: new Date() },
          { userId: 'u2', voteType: 'up', votedAt: new Date() },
          { userId: 'u3', voteType: 'down', votedAt: new Date() }
        ]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.voteOnPost('test-post-id', 'u4', 'up');

      expect(result.score).toBe(2); // 3 up - 1 down = 2
    });

    it('should throw for invalid vote type', async () => {
      await expect(BlogService.voteOnPost('id', 'user', 'sideways'))
        .rejects.toThrow('Invalid vote type');
    });

    it('should throw if post not found', async () => {
      BlogPost.findOne = jest.fn().mockResolvedValue(null);

      await expect(BlogService.voteOnPost('missing', 'user', 'up'))
        .rejects.toThrow('Post not found');
    });
  });

  describe('voteOnComment', () => {
    it('should add vote to specific comment', async () => {
      const mockPost = createMockPost({
        comments: [{
          id: 'c1', userId: 'commenter', userName: 'C', userRole: 'standard',
          content: 'hi', votes: [], score: 0, isDeleted: false
        }]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.voteOnComment('test-post-id', 'c1', 'user-1', 'up');

      expect(result.score).toBe(1);
      expect(result.userVote).toBe('up');
    });

    it('should toggle off existing comment vote', async () => {
      const mockPost = createMockPost({
        comments: [{
          id: 'c1', userId: 'commenter', userName: 'C', userRole: 'standard',
          content: 'hi', votes: [{ userId: 'user-1', voteType: 'up', votedAt: new Date() }],
          score: 1, isDeleted: false
        }]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.voteOnComment('test-post-id', 'c1', 'user-1', 'up');

      expect(result.score).toBe(0);
      expect(result.userVote).toBeNull();
    });

    it('should throw if comment not found', async () => {
      const mockPost = createMockPost({ comments: [] });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      await expect(BlogService.voteOnComment('test-post-id', 'missing', 'user', 'up'))
        .rejects.toThrow('Comment not found');
    });
  });

  describe('addComment', () => {
    it('should add comment with generated id', async () => {
      const mockPost = createMockPost({ comments: [] });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const comment = await BlogService.addComment(
        'test-post-id', 'user-1', 'Jane', 'standard', 'Great post!'
      );

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Great post!');
      expect(comment.userName).toBe('Jane');
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should increment commentCount', async () => {
      const mockPost = createMockPost({ comments: [], commentCount: 0 });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      await BlogService.addComment('test-post-id', 'u1', 'User', 'standard', 'Comment');

      expect(mockPost.commentCount).toBe(1);
    });

    it('should throw if content is empty', async () => {
      await expect(BlogService.addComment('id', 'u', 'n', 'r', ''))
        .rejects.toThrow('Comment content is required');
    });

    it('should throw if content exceeds max length', async () => {
      await expect(BlogService.addComment('id', 'u', 'n', 'r', 'a'.repeat(5001)))
        .rejects.toThrow('Comment must be 5000 characters or less');
    });

    it('should throw if post not found', async () => {
      BlogPost.findOne = jest.fn().mockResolvedValue(null);

      await expect(BlogService.addComment('missing', 'u', 'n', 'r', 'text'))
        .rejects.toThrow('Post not found');
    });
  });

  describe('deleteComment', () => {
    it('should allow comment author to delete', async () => {
      const mockPost = createMockPost({
        comments: [{
          id: 'c1', userId: 'user-1', userName: 'U', userRole: 'standard',
          content: 'hi', votes: [], score: 0, isDeleted: false
        }]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.deleteComment('test-post-id', 'c1', 'user-1', 'standard');

      expect(result.success).toBe(true);
      expect(mockPost.comments[0].isDeleted).toBe(true);
    });

    it('should allow admin to delete any comment', async () => {
      const mockPost = createMockPost({
        comments: [{
          id: 'c1', userId: 'other-user', userName: 'O', userRole: 'standard',
          content: 'hi', votes: [], score: 0, isDeleted: false
        }]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      const result = await BlogService.deleteComment('test-post-id', 'c1', 'admin-1', 'admin');

      expect(result.success).toBe(true);
    });

    it('should reject standard user deleting others comment', async () => {
      const mockPost = createMockPost({
        author: { userId: 'author-1', userName: 'A', userRole: 'admin' },
        comments: [{
          id: 'c1', userId: 'other-user', userName: 'O', userRole: 'standard',
          content: 'hi', votes: [], score: 0, isDeleted: false
        }]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      await expect(BlogService.deleteComment('test-post-id', 'c1', 'random-user', 'standard'))
        .rejects.toThrow('Not authorized to delete this comment');
    });

    it('should update commentCount after delete', async () => {
      const mockPost = createMockPost({
        commentCount: 2,
        comments: [
          { id: 'c1', userId: 'u1', userName: 'U', userRole: 'standard', content: 'a', votes: [], score: 0, isDeleted: false },
          { id: 'c2', userId: 'u2', userName: 'U', userRole: 'standard', content: 'b', votes: [], score: 0, isDeleted: false }
        ]
      });
      BlogPost.findOne = jest.fn().mockResolvedValue(mockPost);

      await BlogService.deleteComment('test-post-id', 'c1', 'u1', 'standard');

      expect(mockPost.commentCount).toBe(1);
    });
  });
});
