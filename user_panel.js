// User Panel Implementation for Mini Social Network

// Current logged-in user
let currentUser = null;

// Check if user is logged in
function checkLoginStatus() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        return true;
    }
    // Redirect to login page if not logged in
    window.location.href = 'user_login.html';
    return false;
}

// Load persisted friendships from localStorage
function loadPersistedFriendships() {
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
    }
    
    const persistedFriendships = localStorage.getItem('socialNetworkFriendships');
    if (persistedFriendships) {
        try {
            const friendshipsData = JSON.parse(persistedFriendships);
            // Restore friendships from persisted data
            for (const [userId, friendIds] of Object.entries(friendshipsData)) {
                const userIdNum = parseInt(userId);
                if (socialNetwork.friendships.has(userIdNum)) {
                    // Clear existing friendships for this user
                    socialNetwork.friendships.get(userIdNum).clear();
                    // Add persisted friendships
                    for (const friendId of friendIds) {
                        socialNetwork.friendships.get(userIdNum).add(parseInt(friendId));
                    }
                }
            }
        } catch (e) {
            console.error('Error loading persisted friendships:', e);
        }
    }
}

// Save friendships to localStorage
function saveFriendshipsToStorage() {
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
    }
    
    const friendshipsData = {};
    for (const [userId, friendIds] of socialNetwork.friendships) {
        friendshipsData[userId] = Array.from(friendIds);
    }
    localStorage.setItem('socialNetworkFriendships', JSON.stringify(friendshipsData));
}

// Load persisted posts from localStorage
function loadPersistedPosts() {
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
    }
    
    const persistedPosts = localStorage.getItem('socialNetworkPosts');
    if (persistedPosts) {
        try {
            const postsData = JSON.parse(persistedPosts);
            // Restore posts from persisted data
            for (const [postId, post] of Object.entries(postsData)) {
                const postIdNum = parseInt(postId);
                // Only load user-generated posts (ID > 60000)
                if (postIdNum > 60000) {
                    socialNetwork.posts.set(postIdNum, post);
                }
            }
        } catch (e) {
            console.error('Error loading persisted posts:', e);
        }
    }
}

// Save posts to localStorage
function savePostsToStorage() {
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
    }
    
    const postsData = {};
    // Only save user-generated posts (ID > 60000) to avoid quota issues
    for (const [postId, post] of socialNetwork.posts) {
        // Only save posts created by users (not the pre-generated ones)
        if (postId > 60000) {
            postsData[postId] = post;
        }
    }
    localStorage.setItem('socialNetworkPosts', JSON.stringify(postsData));
}

// Get posts from friends
function getFriendPosts() {
    if (!currentUser) return [];
    
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    const friendIds = socialNetwork.friendships.get(currentUser.id);
    if (!friendIds) return [];
    
    const friendPosts = [];
    
    // Iterate through all posts and filter those from friends
    for (const [postId, post] of socialNetwork.posts) {
        if (friendIds.has(post.authorId)) {
            const author = socialNetwork.users.get(post.authorId);
            friendPosts.push({
                ...post,
                authorName: author ? author.name : 'Unknown'
            });
        }
    }
    
    // Sort by post ID (newest first)
    friendPosts.sort((a, b) => b.id - a.id);
    
    return friendPosts;
}

// Get friend suggestions based on mutual friends
function getFriendSuggestions(limit = 20) {
    if (!currentUser) return [];
    
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    const suggestions = [];
    const userFriends = socialNetwork.friendships.get(currentUser.id);
    
    // For each user in the network
    for (const [userId, user] of socialNetwork.users) {
        // Skip if it's the current user or already a friend
        if (userId === currentUser.id || userFriends.has(userId)) {
            continue;
        }
        
        // Calculate mutual friends
        const userFriendsList = socialNetwork.friendships.get(userId);
        let mutualCount = 0;
        
        if (userFriendsList) {
            for (const friendId of userFriends) {
                if (userFriendsList.has(friendId)) {
                    mutualCount++;
                }
            }
        }
        
        // Add to suggestions if there are mutual friends
        if (mutualCount > 0) {
            suggestions.push({
                user: user,
                mutualFriends: mutualCount
            });
        }
    }
    
    // Sort by mutual friends count (descending)
    suggestions.sort((a, b) => b.mutualFriends - a.mutualFriends);
    
    // Return top suggestions
    return suggestions.slice(0, limit);
}

// Get user's own posts
function getUserPosts() {
    if (!currentUser) return [];
    
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    const userPosts = [];
    
    // Iterate through all posts and filter those from current user
    for (const [postId, post] of socialNetwork.posts) {
        if (post.authorId === currentUser.id) {
            userPosts.push({
                ...post,
                authorName: currentUser.name
            });
        }
    }
    
    // Sort by post ID (newest first)
    userPosts.sort((a, b) => b.id - a.id);
    
    return userPosts;
}

// Get all friends of the current user
function getUserFriends() {
    if (!currentUser) return [];
    
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    const friendIds = socialNetwork.friendships.get(currentUser.id);
    if (!friendIds) return [];
    
    const friends = [];
    
    // Get friend details
    for (const friendId of friendIds) {
        const friend = socialNetwork.users.get(friendId);
        if (friend) {
            // Get friend's post count
            let postCount = 0;
            for (const [postId, post] of socialNetwork.posts) {
                if (post.authorId === friendId) {
                    postCount++;
                }
            }
            
            friends.push({
                ...friend,
                postCount: postCount
            });
        }
    }
    
    // Sort friends alphabetically by name
    friends.sort((a, b) => a.name.localeCompare(b.name));
    
    return friends;
}

// Get posts by a specific friend
function getFriendPostsById(friendId) {
    if (!currentUser) return [];
    
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    // Check if the user is actually a friend
    const userFriends = socialNetwork.friendships.get(currentUser.id);
    if (!userFriends || !userFriends.has(friendId)) {
        return [];
    }
    
    const friendPosts = [];
    const friend = socialNetwork.users.get(friendId);
    
    // Iterate through all posts and filter those from the specific friend
    for (const [postId, post] of socialNetwork.posts) {
        if (post.authorId === friendId) {
            friendPosts.push({
                ...post,
                authorName: friend ? friend.name : 'Unknown'
            });
        }
    }
    
    // Sort by post ID (newest first)
    friendPosts.sort((a, b) => b.id - a.id);
    
    return friendPosts;
}

// Get friend count
function getFriendCount() {
    if (!currentUser) return 0;
    
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    const friends = socialNetwork.friendships.get(currentUser.id);
    return friends ? friends.size : 0;
}

// Like a post
function likePost(postId) {
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    const post = socialNetwork.posts.get(postId);
    if (!post) return false;
    
    post.likes++;
    socialNetwork.posts.set(postId, post);
    
    // Save posts to localStorage
    savePostsToStorage();
    
    return true;
}

// Share a post
function sharePost(postId) {
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    const post = socialNetwork.posts.get(postId);
    if (!post) return false;
    
    post.shares++;
    socialNetwork.posts.set(postId, post);
    
    // Save posts to localStorage
    savePostsToStorage();
    
    return true;
}

// Add a friend
function addFriend(friendId) {
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    // Validate friend ID
    if (!socialNetwork.users.has(friendId)) {
        showToast('User not found!', 'error');
        return false;
    }
    
    // Check if already friends
    if (socialNetwork.friendships.get(currentUser.id).has(friendId) && 
        socialNetwork.friendships.get(friendId).has(currentUser.id)) {
        showToast('You are already friends with this user!', 'info');
        return false;
    }
    
    // Add friendship (bidirectional)
    socialNetwork.friendships.get(currentUser.id).add(friendId);
    socialNetwork.friendships.get(friendId).add(currentUser.id);
    
    // Save friendships to localStorage
    saveFriendshipsToStorage();
    
    // Update session storage with the updated user data
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showToast('Friend added successfully!', 'success');
    return true;
}

// Create a new post
function createPost(content) {
    if (!currentUser || !content.trim()) {
        showToast('Please enter some content for your post.', 'error');
        return false;
    }
    
    // Initialize network if not already done
    if (!socialNetwork.isInitialized) {
        initializeNetwork();
        // Load persisted data
        loadPersistedFriendships();
        loadPersistedPosts();
    }
    
    // Generate a new post ID (use current max ID + 1)
    let maxId = 60000; // Start from 60001 for user-generated posts
    for (const [postId, post] of socialNetwork.posts) {
        if (postId > maxId) {
            maxId = postId;
        }
    }
    const newPostId = maxId + 1;
    
    // Create the new post
    const newPost = {
        id: newPostId,
        authorId: currentUser.id,
        content: content.trim(),
        likes: 0,
        shares: 0
    };
    
    // Add to posts map
    socialNetwork.posts.set(newPostId, newPost);
    
    // Save posts to localStorage
    savePostsToStorage();
    
    showToast('Post created successfully!', 'success');
    return true;
}

// Logout function
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showToast('You have been logged out.', 'info');
    setTimeout(() => {
        window.location.href = 'user_login.html';
    }, 1000);
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    
    // Add styles
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontWeight = '500';
    toast.style.zIndex = '1000';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    
    // Set background color based on type
    switch(type) {
        case 'success':
            toast.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            toast.style.backgroundColor = '#f44336';
            break;
        case 'info':
            toast.style.backgroundColor = '#2196F3';
            break;
        default:
            toast.style.backgroundColor = '#2196F3';
    }
    
    // Add to document
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// UI Functions
function showUserPanel() {
    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userProfileName').textContent = currentUser.name;
    document.getElementById('friendCount').textContent = getFriendCount();
    
    // Load content
    loadHomeFeed();
    loadFriendSuggestions();
    loadProfile();
}

function loadHomeFeed() {
    const posts = getFriendPosts();
    const feedContainer = document.getElementById('homeFeed');
    feedContainer.innerHTML = '';
    
    if (posts.length === 0) {
        feedContainer.innerHTML = '<p class="no-posts">No posts from friends yet. Add more friends to see their posts!</p>';
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.innerHTML = `
            <div class="post-header">
                <h3>${post.authorName}</h3>
                <span class="post-time">Just now</span>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-actions">
                <button class="action-button like-button" data-post-id="${post.id}">
                    <i class="fas fa-heart"></i> Like (${post.likes})
                </button>
                <button class="action-button comment-button">
                    <i class="fas fa-comment"></i> Comment
                </button>
                <button class="action-button share-button" data-post-id="${post.id}">
                    <i class="fas fa-share"></i> Share (${post.shares})
                </button>
            </div>
        `;
        feedContainer.appendChild(postElement);
    });
    
    // Add event listeners
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', function() {
            const postId = parseInt(this.getAttribute('data-post-id'));
            if (likePost(postId)) {
                // Update button text
                const likeCount = socialNetwork.posts.get(postId).likes;
                this.innerHTML = `<i class="fas fa-heart"></i> Like (${likeCount})`;
                showToast('Post liked!', 'success');
            } else {
                showToast('Failed to like post.', 'error');
            }
        });
    });
    
    document.querySelectorAll('.share-button').forEach(button => {
        button.addEventListener('click', function() {
            const postId = parseInt(this.getAttribute('data-post-id'));
            if (sharePost(postId)) {
                // Update button text
                const shareCount = socialNetwork.posts.get(postId).shares;
                this.innerHTML = `<i class="fas fa-share"></i> Share (${shareCount})`;
                showToast('Post shared!', 'success');
            } else {
                showToast('Failed to share post.', 'error');
            }
        });
    });
}

function loadFriendsList() {
    const friends = getUserFriends();
    const friendsContainer = document.getElementById('friendsList');
    friendsContainer.innerHTML = '';
    
    if (friends.length === 0) {
        friendsContainer.innerHTML = '<p class="no-friends">You don\'t have any friends yet. Add friends to see their posts!</p>';
        return;
    }
    
    friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-card';
        friendElement.innerHTML = `
            <div class="friend-info">
                <h4>${friend.name}</h4>
                <p>${friend.postCount} posts</p>
            </div>
            <button class="view-posts-button" data-friend-id="${friend.id}" data-friend-name="${friend.name}">
                <i class="fas fa-eye"></i> View Posts
            </button>
        `;
        friendsContainer.appendChild(friendElement);
    });
    
    // Add event listeners to view posts buttons
    document.querySelectorAll('.view-posts-button').forEach(button => {
        button.addEventListener('click', function() {
            const friendId = parseInt(this.getAttribute('data-friend-id'));
            const friendName = this.getAttribute('data-friend-name');
            showFriendPosts(friendId, friendName);
        });
    });
}

function showFriendPosts(friendId, friendName) {
    // Update the header with friend's name
    document.getElementById('friendNameHeader').textContent = friendName;
    
    // Show the friend posts tab
    showTab('friendPostsTab');
    
    // Load friend's posts
    loadFriendPosts(friendId);
}

function loadFriendPosts(friendId) {
    const posts = getFriendPostsById(friendId);
    const postsContainer = document.getElementById('friendPostsContainer');
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="no-posts">This friend hasn\'t posted anything yet.</p>';
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.innerHTML = `
            <div class="post-header">
                <h3>${post.authorName}</h3>
                <span class="post-time">Just now</span>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-actions">
                <button class="action-button like-button" data-post-id="${post.id}">
                    <i class="fas fa-heart"></i> Like (${post.likes})
                </button>
                <button class="action-button comment-button">
                    <i class="fas fa-comment"></i> Comment
                </button>
                <button class="action-button share-button" data-post-id="${post.id}">
                    <i class="fas fa-share"></i> Share (${post.shares})
                </button>
            </div>
        `;
        postsContainer.appendChild(postElement);
    });
    
    // Add event listeners
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', function() {
            const postId = parseInt(this.getAttribute('data-post-id'));
            if (likePost(postId)) {
                // Update button text
                const likeCount = socialNetwork.posts.get(postId).likes;
                this.innerHTML = `<i class="fas fa-heart"></i> Like (${likeCount})`;
                showToast('Post liked!', 'success');
            } else {
                showToast('Failed to like post.', 'error');
            }
        });
    });
    
    document.querySelectorAll('.share-button').forEach(button => {
        button.addEventListener('click', function() {
            const postId = parseInt(this.getAttribute('data-post-id'));
            if (sharePost(postId)) {
                // Update button text
                const shareCount = socialNetwork.posts.get(postId).shares;
                this.innerHTML = `<i class="fas fa-share"></i> Share (${shareCount})`;
                showToast('Post shared!', 'success');
            } else {
                showToast('Failed to share post.', 'error');
            }
        });
    });
}

function loadFriendSuggestions() {
    const suggestions = getFriendSuggestions(20);
    const suggestionsContainer = document.getElementById('friendSuggestions');
    suggestionsContainer.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsContainer.innerHTML = '<p class="no-suggestions">No friend suggestions available.</p>';
        return;
    }
    
    suggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'suggestion-card';
        suggestionElement.innerHTML = `
            <div class="suggestion-info">
                <h4>${suggestion.user.name}</h4>
                <p>${suggestion.mutualFriends} mutual friends</p>
            </div>
            <button class="add-friend-button" data-user-id="${suggestion.user.id}">
                <i class="fas fa-user-plus"></i> Add Friend
            </button>
        `;
        suggestionsContainer.appendChild(suggestionElement);
    });
    
    // Add event listeners
    document.querySelectorAll('.add-friend-button').forEach(button => {
        button.addEventListener('click', function() {
            const userId = parseInt(this.getAttribute('data-user-id'));
            if (addFriend(userId)) {
                this.innerHTML = '<i class="fas fa-check"></i> Friend Added';
                this.disabled = true;
                this.classList.add('added');
                
                // Update friend count
                document.getElementById('friendCount').textContent = getFriendCount();
                
                // Reload friend suggestions to remove the added friend
                loadFriendSuggestions();
                
                // Reload home feed to show posts from the new friend
                loadHomeFeed();
            }
        });
    });
}

function loadProfile() {
    const posts = getUserPosts();
    const profilePostsContainer = document.getElementById('profilePosts');
    profilePostsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        profilePostsContainer.innerHTML = '<p class="no-posts">You haven\'t posted anything yet.</p>';
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'profile-post';
        postElement.innerHTML = `
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-stats">
                <span><i class="fas fa-heart"></i> ${post.likes}</span>
                <span><i class="fas fa-share"></i> ${post.shares}</span>
            </div>
        `;
        profilePostsContainer.appendChild(postElement);
    });
}

// Handle post creation
function handleCreatePost() {
    const postTextarea = document.querySelector('#addPostTab textarea');
    const content = postTextarea.value.trim();
    
    if (!content) {
        showToast('Please enter some content for your post.', 'error');
        return;
    }
    
    if (createPost(content)) {
        // Clear the textarea
        postTextarea.value = '';
        
        // Reload home feed and profile to show the new post
        loadHomeFeed();
        loadProfile();
        
        // Switch to home tab to see the new post
        showTab('homeTab');
    }
}

// Navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked nav item
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Load content based on tab
    switch(tabName) {
        case 'homeTab':
            loadHomeFeed();
            break;
        case 'friendsTab':
            loadFriendsList();
            break;
        case 'friendPostsTab':
            // Content is loaded when showFriendPosts is called
            break;
        case 'searchTab':
            // Search functionality can be implemented here
            break;
        case 'addPostTab':
            // Add post functionality is handled by the form
            break;
        case 'profileTab':
            loadProfile();
            break;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!checkLoginStatus()) {
        return;
    }
    
    // Show user panel
    showUserPanel();
    
    // Logout button
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    // Add post button
    const postButton = document.querySelector('#addPostTab .post-button');
    if (postButton) {
        postButton.addEventListener('click', handleCreatePost);
    }
    
    // Back to friends button
    document.getElementById('backToFriendsButton').addEventListener('click', function() {
        showTab('friendsTab');
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            showTab(tabId);
        });
    });
    
    // Search functionality
    document.querySelector('.search-bar button').addEventListener('click', function() {
        const searchTerm = document.querySelector('.search-bar input').value.trim();
        if (searchTerm) {
            showToast(`Searching for: ${searchTerm}`, 'info');
            // In a real app, you would implement search functionality here
        }
    });
    
    // Allow search with Enter key
    document.querySelector('.search-bar input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.querySelector('.search-bar button').click();
        }
    });
});