/**
 * BlogModule - Blog system for Sister's Promise
 * Handles homepage featured posts, blog listing, and single post views
 */
var BlogModule = {
  apiUrl: null,

  init: function() {
    this.apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000/api'
      : window.location.protocol + '//' + window.location.host + '/api';

    var homepageContainer = document.getElementById('blog-posts-container');
    if (homepageContainer) {
      this.loadFeaturedPosts(homepageContainer);
    }

    var listingContainer = document.getElementById('blog-listing');
    if (listingContainer) {
      this.loadBlogListing(listingContainer, 1);
    }

    var postContainer = document.getElementById('blog-post-content');
    if (postContainer) {
      this.loadSinglePost(postContainer);
    }
  },

  sanitize: function(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  formatDate: function(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  formatRelativeTime: function(dateStr) {
    if (!dateStr) return '';
    var now = Date.now();
    var diff = now - new Date(dateStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    return this.formatDate(dateStr);
  },

  getHeaders: function() {
    var headers = { 'Content-Type': 'application/json' };
    if (typeof AuthService !== 'undefined' && AuthService.getToken()) {
      headers['Authorization'] = 'Bearer ' + AuthService.getToken();
    }
    return headers;
  },

  isLoggedIn: function() {
    return typeof AuthService !== 'undefined' && AuthService.isLoggedIn();
  },

  getPagePath: function(page) {
    if (window.location.pathname.includes('/pages/')) return page;
    return './pages/' + page;
  },

  // ---- Homepage Featured Posts ----

  loadFeaturedPosts: function(container) {
    var self = this;
    fetch(this.apiUrl + '/blog/posts/featured')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.data && data.data.posts && data.data.posts.length > 0) {
          container.innerHTML = '';
          data.data.posts.forEach(function(post) {
            container.innerHTML += self.renderFeaturedCard(post);
          });
        } else {
          container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No blog posts yet. Check back soon!</p></div>';
        }
      })
      .catch(function() {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No blog posts yet. Check back soon!</p></div>';
      });
  },

  renderFeaturedCard: function(post) {
    var imgSrc = post.coverImage || './assets/img/bg-landing002.png';
    var postPath = this.getPagePath('blog-post.html') + '?slug=' + this.sanitize(post.slug);
    return '<div class="col-lg-3 col-md-6">' +
      '<div class="card border-0 shadow-sm h-100 blog-card" style="border-radius: 12px; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer;" onclick="window.location.href=\'' + postPath + '\'">' +
        '<img src="' + this.sanitize(imgSrc) + '" class="card-img-top" alt="' + this.sanitize(post.title) + '" style="height: 180px; object-fit: cover;">' +
        '<div class="card-body d-flex flex-column">' +
          '<h6 class="fw-bold mb-2" style="color: #2d3e50;">' + this.sanitize(post.title) + '</h6>' +
          '<p class="text-muted small flex-grow-1">' + this.sanitize((post.excerpt || '').substring(0, 100)) + '</p>' +
          '<div class="d-flex justify-content-between align-items-center mt-2">' +
            '<small class="text-muted">' +
              '<i class="fas fa-arrow-up" style="color: #C9A961;"></i> ' + (post.score || 0) +
              ' &middot; <i class="fas fa-comment"></i> ' + (post.commentCount || 0) +
            '</small>' +
            '<a href="' + postPath + '" class="btn btn-sm" style="color: #C9A961; font-weight: 600;">Read</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // ---- Blog Listing Page ----

  loadBlogListing: function(container, page) {
    var self = this;
    var sort = document.getElementById('blog-sort') ? document.getElementById('blog-sort').value : 'newest';

    fetch(this.apiUrl + '/blog/posts?page=' + page + '&limit=9&sort=' + sort)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.data) {
          var posts = data.data.posts || [];
          var pagination = data.data.pagination || {};

          if (posts.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No blog posts yet. Check back soon!</p></div>';
            return;
          }

          var html = '';
          posts.forEach(function(post) {
            html += self.renderListingCard(post);
          });
          container.innerHTML = html;

          // Render pagination
          var pagDiv = document.getElementById('blog-pagination');
          if (pagDiv && pagination.pages > 1) {
            var pagHtml = '<nav><ul class="pagination justify-content-center">';
            for (var i = 1; i <= pagination.pages; i++) {
              pagHtml += '<li class="page-item' + (i === page ? ' active' : '') + '">' +
                '<a class="page-link" href="#" onclick="BlogModule.loadBlogListing(document.getElementById(\'blog-listing\'), ' + i + '); return false;" style="' + (i === page ? 'background-color: #C9A961; border-color: #C9A961;' : 'color: #C9A961;') + '">' + i + '</a></li>';
            }
            pagHtml += '</ul></nav>';
            pagDiv.innerHTML = pagHtml;
          }
        }
      })
      .catch(function() {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Failed to load posts.</p></div>';
      });
  },

  renderListingCard: function(post) {
    var imgSrc = post.coverImage || '../assets/img/bg-landing002.png';
    var postPath = 'blog-post.html?slug=' + this.sanitize(post.slug);
    return '<div class="col-lg-4 col-md-6 mb-4">' +
      '<div class="card border-0 shadow-sm h-100" style="border-radius: 12px; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease;">' +
        '<img src="' + this.sanitize(imgSrc) + '" class="card-img-top" alt="' + this.sanitize(post.title) + '" style="height: 200px; object-fit: cover;">' +
        '<div class="card-body d-flex flex-column">' +
          '<div class="mb-2"><small class="text-muted">' + this.formatDate(post.publishedAt) + '</small>' +
            (post.category ? ' <span class="badge" style="background-color: #C9A961;">' + this.sanitize(post.category) + '</span>' : '') +
          '</div>' +
          '<h5 class="fw-bold mb-2" style="color: #2d3e50;">' + this.sanitize(post.title) + '</h5>' +
          '<p class="text-muted small flex-grow-1">' + this.sanitize((post.excerpt || '').substring(0, 150)) + '</p>' +
          '<div class="d-flex justify-content-between align-items-center mt-3">' +
            '<div>' +
              '<span class="text-muted small"><i class="fas fa-arrow-up" style="color: #C9A961;"></i> ' + (post.score || 0) + '</span>' +
              ' <span class="text-muted small"><i class="fas fa-comment"></i> ' + (post.commentCount || 0) + '</span>' +
              ' <span class="text-muted small"><i class="fas fa-eye"></i> ' + (post.viewCount || 0) + '</span>' +
            '</div>' +
            '<a href="' + postPath + '" class="btn btn-sm" style="background: linear-gradient(135deg, #C9A961, #A0522D); color: white; font-weight: 600;">Read More</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // ---- Single Post View ----

  loadSinglePost: function(container) {
    var self = this;
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');

    if (!slug) {
      container.innerHTML = '<div class="text-center py-5"><p class="text-muted">Post not found.</p><a href="blog.html" style="color: #C9A961;">Back to Blog</a></div>';
      return;
    }

    fetch(this.apiUrl + '/blog/posts/' + slug, { headers: this.getHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.data && data.data.post) {
          self.renderSinglePost(container, data.data.post);
        } else {
          container.innerHTML = '<div class="text-center py-5"><p class="text-muted">Post not found.</p><a href="blog.html" style="color: #C9A961;">Back to Blog</a></div>';
        }
      })
      .catch(function() {
        container.innerHTML = '<div class="text-center py-5"><p class="text-muted">Failed to load post.</p></div>';
      });
  },

  renderSinglePost: function(container, post) {
    var self = this;
    document.title = post.title + ' - Sister\'s Promise Blog';

    var coverHtml = post.coverImage
      ? '<img src="' + this.sanitize(post.coverImage) + '" class="img-fluid w-100 mb-4" alt="' + this.sanitize(post.title) + '" style="max-height: 400px; object-fit: cover; border-radius: 12px;">'
      : '';

    var tagsHtml = '';
    if (post.tags && post.tags.length > 0) {
      tagsHtml = '<div class="mb-3">';
      post.tags.forEach(function(tag) {
        tagsHtml += '<span class="badge me-1" style="background-color: #e9ecef; color: #666;">' + self.sanitize(tag) + '</span>';
      });
      tagsHtml += '</div>';
    }

    var html = coverHtml +
      '<div class="row">' +
        '<div class="col-auto text-center pe-0">' +
          this.renderVoteWidget('post', post.id, null, post.score || 0, post.userVote || null) +
        '</div>' +
        '<div class="col">' +
          '<h1 class="fw-bold mb-2" style="color: #2d3e50;">' + this.sanitize(post.title) + '</h1>' +
          '<div class="mb-3 text-muted small">' +
            'By ' + this.sanitize(post.author ? post.author.userName : 'Unknown') +
            ' &middot; ' + this.formatDate(post.publishedAt) +
            ' &middot; <i class="fas fa-eye"></i> ' + (post.viewCount || 0) + ' views' +
            ' &middot; <i class="fas fa-comment"></i> ' + (post.commentCount || 0) + ' comments' +
          '</div>' +
          tagsHtml +
          '<div class="blog-content mb-5" style="line-height: 1.8; font-size: 1.05rem;">' + (post.content || '') + '</div>' +
        '</div>' +
      '</div>' +
      '<hr class="my-4">' +
      '<div id="comments-section">' +
        '<h4 class="fw-bold mb-4" style="color: #2d3e50;">Comments (' + (post.comments ? post.comments.length : 0) + ')</h4>' +
        this.renderCommentForm(post.id) +
        this.renderComments(post.comments || [], post.id) +
      '</div>';

    container.innerHTML = html;
    this.attachVoteHandlers();
    this.attachCommentHandler(post.id);
  },

  renderVoteWidget: function(type, postId, commentId, score, userVote) {
    var upColor = userVote === 'up' ? '#C9A961' : '#ccc';
    var downColor = userVote === 'down' ? '#7c5cbf' : '#ccc';
    var dataAttrs = 'data-type="' + type + '" data-post-id="' + postId + '"' +
      (commentId ? ' data-comment-id="' + commentId + '"' : '');

    return '<div class="vote-widget text-center" style="min-width: 40px;">' +
      '<button class="btn btn-sm p-0 vote-btn vote-up" ' + dataAttrs + ' data-vote="up" style="color: ' + upColor + '; font-size: 1.2rem; background: none; border: none; cursor: pointer;"><i class="fas fa-arrow-up"></i></button>' +
      '<div class="vote-score fw-bold my-1" ' + dataAttrs + '>' + score + '</div>' +
      '<button class="btn btn-sm p-0 vote-btn vote-down" ' + dataAttrs + ' data-vote="down" style="color: ' + downColor + '; font-size: 1.2rem; background: none; border: none; cursor: pointer;"><i class="fas fa-arrow-down"></i></button>' +
    '</div>';
  },

  renderCommentForm: function(postId) {
    if (!this.isLoggedIn()) {
      var signInPath = this.getPagePath ? 'sign-in.html' : 'sign-in.html';
      return '<div class="mb-4 p-3 rounded" style="background-color: #f8f9fa;">' +
        '<p class="mb-0 text-muted"><a href="' + signInPath + '" style="color: #C9A961; font-weight: 600;">Sign in</a> to leave a comment.</p>' +
      '</div>';
    }

    return '<div class="mb-4" id="comment-form-container">' +
      '<textarea id="comment-input" class="form-control mb-2" rows="3" placeholder="Share your thoughts..." maxlength="5000" style="border-radius: 8px;"></textarea>' +
      '<button id="comment-submit" class="btn btn-sm" data-post-id="' + postId + '" style="background: linear-gradient(135deg, #C9A961, #A0522D); color: white; font-weight: 600;">Post Comment</button>' +
    '</div>';
  },

  renderComments: function(comments, postId) {
    if (!comments || comments.length === 0) {
      return '<p class="text-muted">No comments yet. Be the first to share your thoughts!</p>';
    }

    var self = this;
    // Sort by score descending
    comments.sort(function(a, b) { return (b.score || 0) - (a.score || 0); });

    var html = '';
    comments.forEach(function(c) {
      html += '<div class="d-flex mb-3 p-3 rounded" style="background-color: #f8f9fa;">' +
        '<div class="me-3">' +
          self.renderVoteWidget('comment', postId, c.id, c.score || 0, c.userVote || null) +
        '</div>' +
        '<div class="flex-grow-1">' +
          '<div class="mb-1">' +
            '<strong style="color: #2d3e50;">' + self.sanitize(c.userName) + '</strong>' +
            ' <small class="text-muted">' + self.formatRelativeTime(c.createdAt) + '</small>' +
          '</div>' +
          '<p class="mb-0">' + self.sanitize(c.content) + '</p>' +
        '</div>' +
      '</div>';
    });

    return html;
  },

  attachVoteHandlers: function() {
    var self = this;
    document.querySelectorAll('.vote-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!self.isLoggedIn()) {
          alert('Please sign in to vote.');
          return;
        }
        var type = this.getAttribute('data-type');
        var postId = this.getAttribute('data-post-id');
        var commentId = this.getAttribute('data-comment-id');
        var voteType = this.getAttribute('data-vote');
        self.handleVote(type, postId, commentId, voteType);
      });
    });
  },

  handleVote: function(type, postId, commentId, voteType) {
    var self = this;
    var url = this.apiUrl + '/blog/posts/' + postId;
    if (type === 'comment') {
      url += '/comments/' + commentId;
    }
    url += '/vote';

    fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ voteType: voteType })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.data) {
          // Reload the post to update all vote states
          var postContainer = document.getElementById('blog-post-content');
          if (postContainer) {
            self.loadSinglePost(postContainer);
          }
        }
      })
      .catch(function() {
        alert('Failed to register vote. Please try again.');
      });
  },

  attachCommentHandler: function(postId) {
    var self = this;
    var submitBtn = document.getElementById('comment-submit');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function() {
      var input = document.getElementById('comment-input');
      var content = input ? input.value.trim() : '';
      if (!content) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      fetch(self.apiUrl + '/blog/posts/' + postId + '/comments', {
        method: 'POST',
        headers: self.getHeaders(),
        body: JSON.stringify({ content: content })
      })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.success) {
            // Reload post to show new comment
            var postContainer = document.getElementById('blog-post-content');
            if (postContainer) {
              self.loadSinglePost(postContainer);
            }
          } else {
            alert(data.error || 'Failed to post comment.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Comment';
          }
        })
        .catch(function() {
          alert('Failed to post comment. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Post Comment';
        });
    });
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { BlogModule.init(); });
} else {
  BlogModule.init();
}
