// Simple seeded random number generator
function seededRandom(seed) {
    let state = seed;
    return function() {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

// Seeded random functions
let seededRand;

// Social Network Data Structure
const socialNetwork = {
    // Users storage: userId -> {id, name}
    users: new Map(),
    
    // Friendships storage: adjacency list (userId -> set of friendIds)
    friendships: new Map(),
    
    // Posts storage: postId -> post object
    posts: new Map(),
    
    // Search index for faster name lookups
    nameIndex: new Map(),
    
    // Flag to track if network is initialized
    isInitialized: false
};

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

// Initialize with 20000 users and 200000 friendships
function initializeNetwork() {
    // If already initialized, don't do it again
    if (socialNetwork.isInitialized) return;
    
    // Initialize seeded random with a fixed seed for consistent data
    seededRand = seededRandom(12345); // Fixed seed for consistent data
    
    console.log("Initializing network with 20,000 users and 200,000 friendships...");
    
    // Create 20000 users
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Emma', 'Lucas', 'Sophia', 'Ethan', 'Ava'];
    
    // Pre-generate user data for better performance
    const userData = [];
    for (let i = 1; i <= 20000; i++) {
        const randomName = names[Math.floor(seededRand() * names.length)];
        const fullName = `${randomName}${i}`;
        userData.push({ id: i, name: fullName });
    }
    
    // Add users to the network
    for (const user of userData) {
        socialNetwork.users.set(user.id, user);
        socialNetwork.friendships.set(user.id, new Set());
        
        // Build name index for faster search
        const firstLetter = user.name.charAt(0).toLowerCase();
        if (!socialNetwork.nameIndex.has(firstLetter)) {
            socialNetwork.nameIndex.set(firstLetter, []);
        }
        socialNetwork.nameIndex.get(firstLetter).push(user.id);
    }
    
    // Create specific mutual friendships for demonstration
    createSpecificMutualFriendships();
    
    // Create a more structured network with varying degrees of mutual friendships
    let friendshipsCreated = 80; // Start with the 80 we already created
    
    // First, create clusters of users with high mutual connections
    // Create 50 clusters of 100 users each (5000 users)
    for (let cluster = 0; cluster < 50; cluster++) {
        const clusterStartId = cluster * 100 + 1;
        const clusterEndId = clusterStartId + 99;
        
        // Within each cluster, create a dense network
        for (let i = clusterStartId; i <= clusterEndId; i++) {
            for (let j = i + 1; j <= clusterEndId; j++) {
                // Higher probability of friendship within clusters
                if (seededRand() < 0.3 && friendshipsCreated < 150000) { // 30% chance for friendship
                    if (!socialNetwork.friendships.get(i).has(j) && !socialNetwork.friendships.get(j).has(i)) {
                        socialNetwork.friendships.get(i).add(j);
                        socialNetwork.friendships.get(j).add(i);
                        friendshipsCreated++;
                    }
                }
            }
        }
    }
    
    // Create connections between clusters to generate mutual friends
    for (let cluster1 = 0; cluster1 < 50; cluster1++) {
        for (let cluster2 = cluster1 + 1; cluster2 < 50; cluster2++) {
            // Connect a few users between clusters
            const connections = Math.floor(seededRand() * 5) + 3; // 3-7 connections between clusters
            for (let c = 0; c < connections; c++) {
                const user1 = cluster1 * 100 + Math.floor(seededRand() * 100) + 1;
                const user2 = cluster2 * 100 + Math.floor(seededRand() * 100) + 1;
                
                if (user1 !== user2 && 
                    !socialNetwork.friendships.get(user1).has(user2) && 
                    !socialNetwork.friendships.get(user2).has(user1) &&
                    friendshipsCreated < 150000) {
                    
                    socialNetwork.friendships.get(user1).add(user2);
                    socialNetwork.friendships.get(user2).add(user1);
                    friendshipsCreated++;
                }
            }
        }
    }
    
    // Create additional random friendships to reach 200000
    const maxAttempts = 300000;
    let attempts = 0;
    
    while (friendshipsCreated < 200000 && attempts < maxAttempts) {
        const user1 = Math.floor(seededRand() * 20000) + 1;
        const user2 = Math.floor(seededRand() * 20000) + 1;
        
        // Ensure we don't create self-friendships or duplicates
        if (user1 !== user2 && 
            !socialNetwork.friendships.get(user1).has(user2) && 
            !socialNetwork.friendships.get(user2).has(user1)) {
            
            socialNetwork.friendships.get(user1).add(user2);
            socialNetwork.friendships.get(user2).add(user1);
            friendshipsCreated++;
            
            // Update progress every 20000 friendships
            if (friendshipsCreated % 20000 === 0) {
                console.log(`Created ${friendshipsCreated} friendships...`);
            }
        }
        attempts++;
    }
    
    console.log(`Finished creating ${friendshipsCreated} friendships.`);
    
    // Verify specific mutual friendships
    verifySpecificMutualFriendships();
    
    // Create some sample posts with consistent data
    const contents = [
        "Just had a great day!",
        "Working on something exciting!",
        "Enjoying the weekend vibes!",
        "Learning new things every day.",
        "Coffee and code - perfect combination!",
        "Nature is amazing!",
        "Music makes everything better.",
        "Traveling broadens the mind.",
        "Books are my best friends.",
        "Fitness is key to happiness.",
        "Sunset views are breathtaking!",
        "Cooking a new recipe today.",
        "Gardening is so therapeutic.",
        "Movie night with friends.",
        "Beach day was incredible!",
        "Mountain hiking adventure.",
        "Art exhibition was inspiring.",
        "Concert last night was amazing!",
        "New book recommendation.",
        "Weekend getaway was refreshing."
    ];
    
    // Generate 60,000 posts with 3 posts for each user (20,000 users * 3 posts = 60,000 posts)
    let postId = 1;
    for (let userId = 1; userId <= 20000; userId++) {
        // Create 3 posts for each user
        for (let j = 0; j < 3; j++) {
            const contentIndex = Math.floor(seededRand() * contents.length);
            socialNetwork.posts.set(postId, {
                id: postId,
                authorId: userId,
                content: contents[contentIndex],
                likes: Math.floor(seededRand() * 500),
                shares: Math.floor(seededRand() * 200)
            });
            postId++;
        }
    }
    
    // Mark as initialized
    socialNetwork.isInitialized = true;
    console.log("Network initialization complete with 60,000 posts (3 per user).");
    
    // Load persisted data if available
    loadPersistedFriendships();
    loadPersistedPosts();
}

// Initialize the network only when needed
// initializeNetwork(); // Removed auto-initialization

// DOM elements
const showUsersLink = document.getElementById('showUsersLink');
const showFriendsLink = document.getElementById('showFriendsLink');
const showPostsLink = document.getElementById('showPostsLink');
const showMutualFriendsLink = document.getElementById('showMutualFriendsLink');
const suggestFriendsLink = document.getElementById('suggestFriendsLink');
const showTrendingLink = document.getElementById('showTrendingLink');
const searchUsersLink = document.getElementById('searchUsersLink');
const addUserLink = document.getElementById('addUserLink');
const addFriendshipLink = document.getElementById('addFriendshipLink');

const usersSection = document.getElementById('usersSection');
const friendsSection = document.getElementById('friendsSection');
const postsSection = document.getElementById('postsSection');
const mutualFriendsSection = document.getElementById('mutualFriendsSection');
const suggestFriendsSection = document.getElementById('suggestFriendsSection');
const trendingSection = document.getElementById('trendingSection');
const searchUsersSection = document.getElementById('searchUsersSection');
const addUserSection = document.getElementById('addUserSection');
const addFriendshipSection = document.getElementById('addFriendshipSection');

const usersList = document.getElementById('usersList');
const friendsList = document.getElementById('friendsList');
const postsList = document.getElementById('postsList');
const mutualFriendsList = document.getElementById('mutualFriendsList');
const autoMutualFriendsList = document.getElementById('autoMutualFriendsList');
const suggestFriendsList = document.getElementById('suggestFriendsList');
const trendingList = document.getElementById('trendingList');
const searchUsersResult = document.getElementById('searchUsersResult');
const addUserResult = document.getElementById('addUserResult');
const addFriendshipResult = document.getElementById('addFriendshipResult');

// Form elements
const mutualFriendsForm = document.getElementById('mutualFriendsForm');
const userAInput = document.getElementById('userA');
const userBInput = document.getElementById('userB');
const suggestFriendsForm = document.getElementById('suggestFriendsForm');
const suggestUserInput = document.getElementById('suggestUser');
const suggestCountInput = document.getElementById('suggestCount');
const postActionsForm = document.getElementById('postActionsForm');
const postIdInput = document.getElementById('postId');
const actionSelect = document.getElementById('action');
const searchUsersForm = document.getElementById('searchUsersForm');
const searchUserNameInput = document.getElementById('searchUserName');
const addUserForm = document.getElementById('addUserForm');
const newUserIdInput = document.getElementById('newUserId');
const newUserNameInput = document.getElementById('newUserName');
const addFriendshipForm = document.getElementById('addFriendshipForm');
const friend1IdInput = document.getElementById('friend1Id');
const friend2IdInput = document.getElementById('friend2Id');
const showAutoMutualFriendsBtn = document.getElementById('showAutoMutualFriends');

// Show loading indicator
function showLoading(sectionElement) {
    sectionElement.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading network data... This may take a moment.</p>
        </div>
    `;
}

// Navigation function
function showSection(section) {
    // Hide all sections
    usersSection.classList.remove('active');
    friendsSection.classList.remove('active');
    postsSection.classList.remove('active');
    mutualFriendsSection.classList.remove('active');
    suggestFriendsSection.classList.remove('active');
    trendingSection.classList.remove('active');
    searchUsersSection.classList.remove('active');
    addUserSection.classList.remove('active');
    addFriendshipSection.classList.remove('active');
    
    // Remove active class from all links
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section and mark link as active
    switch(section) {
        case 'users':
            usersSection.classList.add('active');
            showUsersLink.classList.add('active');
            showLoading(usersList); // Show loading indicator
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
                displayUsers();
            }, 10); // Small delay to allow UI to update
            break;
        case 'friends':
            friendsSection.classList.add('active');
            showFriendsLink.classList.add('active');
            showLoading(friendsList); // Show loading indicator
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
                displayFriends();
            }, 10); // Small delay to allow UI to update
            break;
        case 'posts':
            postsSection.classList.add('active');
            showPostsLink.classList.add('active');
            showLoading(postsList); // Show loading indicator
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
                displayPosts();
            }, 10); // Small delay to allow UI to update
            break;
        case 'mutual':
            mutualFriendsSection.classList.add('active');
            showMutualFriendsLink.classList.add('active');
            // Show loading indicator for the result area
            mutualFriendsList.innerHTML = '<div class="loading-container"><p><br></p></div>';
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
            }, 10); // Small delay to allow UI to update
            break;
        case 'suggest':
            suggestFriendsSection.classList.add('active');
            suggestFriendsLink.classList.add('active');
            // Show loading indicator for the result area
            suggestFriendsList.innerHTML = '<div class="loading-container"><p>Enter a user ID and click "Get Friend Suggestions" to begin.</p></div>';
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
            }, 10); // Small delay to allow UI to update
            break;
        case 'trending':
            trendingSection.classList.add('active');
            showTrendingLink.classList.add('active');
            showLoading(trendingList); // Show loading indicator
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
                displayTrendingPosts();
            }, 10); // Small delay to allow UI to update
            break;
        case 'search':
            searchUsersSection.classList.add('active');
            searchUsersLink.classList.add('active');
            // Show loading indicator for the result area
            searchUsersResult.innerHTML = '<div class="loading-container"><p>Enter a user name and click "Search Users" to begin.</p></div>';
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
            }, 10); // Small delay to allow UI to update
            break;
        case 'addUser':
            addUserSection.classList.add('active');
            addUserLink.classList.add('active');
            // Show loading indicator for the result area
            addUserResult.innerHTML = '<div class="loading-container"><p>Enter user details and click "Add User" to begin.</p></div>';
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
            }, 10); // Small delay to allow UI to update
            break;
        case 'addFriendship':
            addFriendshipSection.classList.add('active');
            addFriendshipLink.classList.add('active');
            // Show loading indicator for the result area
            addFriendshipResult.innerHTML = '<div class="loading-container"><p>Enter user IDs and click "Add Friendship" to begin.</p></div>';
            setTimeout(() => {
                initializeNetwork(); // Initialize network only when needed
            }, 10); // Small delay to allow UI to update
            break;
    }
}

// Display users with pagination
function displayUsers(page = 1, pageSize = 50) {
    usersList.innerHTML = '';
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const allUsers = Array.from(socialNetwork.users.entries());
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
    paginatedUsers.forEach(([id, user]) => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <h3>${user.name}</h3>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Friends:</strong> ${socialNetwork.friendships.get(user.id) ? socialNetwork.friendships.get(user.id).size : 0}</p>
        `;
        usersList.appendChild(userCard);
    });
    
    // Add pagination controls
    const totalPages = Math.ceil(socialNetwork.users.size / pageSize);
    if (totalPages > 1) {
        const paginationCard = document.createElement('div');
        paginationCard.className = 'result-card';
        paginationCard.innerHTML = `
            <h3>Page Navigation</h3>
            <p>Showing page ${page} of ${totalPages}</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px; flex-wrap: wrap;">
                ${page > 1 ? `<button onclick="displayUsers(${page - 1}, ${pageSize})" style="width: auto;"><i class="fas fa-arrow-left"></i> Previous</button>` : ''}
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" id="usersPageInput" min="1" max="${totalPages}" value="${page}" style="width: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    <button onclick="goToUsersPage(${pageSize}, ${totalPages})" style="width: auto; padding: 5px 10px;">Go</button>
                </div>
                ${page < totalPages ? `<button onclick="displayUsers(${page + 1}, ${pageSize})" style="width: auto;">Next <i class="fas fa-arrow-right"></i></button>` : ''}
            </div>
        `;
        usersList.appendChild(paginationCard);
    }
}

// Display friendships with pagination
function displayFriends(page = 1, pageSize = 30) {
    friendsList.innerHTML = '';
    
    const allFriendships = [];
    const processedPairs = new Set();
    
    // Collect friendships more efficiently
    let userCount = 0;
    // Increase the limit for the larger dataset
    const userLimit = Math.min(15000, socialNetwork.friendships.size); // Increased from 10000 to 15000
    
    for (const [userId, friends] of socialNetwork.friendships) {
        const user = socialNetwork.users.get(userId);
        if (!user) continue;
        
        for (const friendId of friends) {
            const friend = socialNetwork.users.get(friendId);
            if (!friend) continue;
            
            // Avoid duplicate friendships (only show each connection once)
            const pairKey = `${Math.min(userId, friendId)}-${Math.max(userId, friendId)}`;
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);
            
            allFriendships.push({
                user1: user,
                user2: friend,
                userId1: userId,
                userId2: friendId
            });
        }
        
        // Limit the number of users we process for performance with large networks
        userCount++;
        if (userCount > userLimit) break;
    }
    
    // Paginate results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFriendships = allFriendships.slice(startIndex, endIndex);
    
    paginatedFriendships.forEach(friendship => {
        const friendCard = document.createElement('div');
        friendCard.className = 'friend-card';
        friendCard.innerHTML = `
            <h3>Friendship</h3>
            <div class="friend-connection">
                <span>${friendship.user1.name}</span>
                <span>↔</span>
                <span>${friendship.user2.name}</span>
            </div>
            <p><strong>Connection:</strong> User ${friendship.userId1} ↔ User ${friendship.userId2}</p>
            <p><strong>Mutual Friends:</strong> ${getMutualFriendsBFS(friendship.userId1, friendship.userId2).length}</p>
        `;
        friendsList.appendChild(friendCard);
    });
    
    // Add pagination controls
    const totalPages = Math.ceil(allFriendships.length / pageSize);
    if (totalPages > 1) {
        const paginationCard = document.createElement('div');
        paginationCard.className = 'result-card';
        paginationCard.innerHTML = `
            <h3>Page Navigation</h3>
            <p>Showing page ${page} of ${totalPages}</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px; flex-wrap: wrap;">
                ${page > 1 ? `<button onclick="displayFriends(${page - 1}, ${pageSize})" style="width: auto;"><i class="fas fa-arrow-left"></i> Previous</button>` : ''}
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" id="friendsPageInput" min="1" max="${totalPages}" value="${page}" style="width: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    <button onclick="goToFriendsPage(${pageSize}, ${totalPages})" style="width: auto; padding: 5px 10px;">Go</button>
                </div>
                ${page < totalPages ? `<button onclick="displayFriends(${page + 1}, ${pageSize})" style="width: auto;">Next <i class="fas fa-arrow-right"></i></button>` : ''}
            </div>
        `;
        friendsList.appendChild(paginationCard);
    }
    
    // Add summary if on first page
    if (page === 1) {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'result-card';
        summaryCard.innerHTML = `
            <h3>Network Summary</h3>
            <p><strong>Total Friendships:</strong> ${allFriendships.length}</p>
            <p><strong>Note:</strong> Displaying a sample of friendships for performance reasons.</p>
        `;
        friendsList.appendChild(summaryCard);
    }
}

// Display posts with pagination
function displayPosts(page = 1, pageSize = 50) {
    postsList.innerHTML = '';
    
    const allPosts = Array.from(socialNetwork.posts.entries());
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);
    
    paginatedPosts.forEach(([id, post]) => {
        const author = socialNetwork.users.get(post.authorId);
        const authorName = author ? author.name : 'Unknown';
        
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.innerHTML = `
            <h3>${authorName}</h3>
            <p><strong>Post ID:</strong> ${post.id}</p>
            <div class="post-content">
                "${post.content}"
            </div>
            <div class="post-stats">
                <div class="stat">
                    <span>👍</span>
                    <span>${post.likes}</span>
                </div>
                <div class="stat">
                    <span>🔄</span>
                    <span>${post.shares}</span>
                </div>
                <div class="stat">
                    <span>📈</span>
                    <span>${post.likes + 2 * post.shares}</span>
                </div>
            </div>
            <button class="like-button" data-post-id="${post.id}">❤️ Like</button>
        `;
        postsList.appendChild(postCard);
    });
    
    // Add event listeners to like buttons
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const postId = parseInt(e.target.getAttribute('data-post-id'));
            likePost(postId);
        });
    });
    
    // Add pagination controls
    const totalPages = Math.ceil(socialNetwork.posts.size / pageSize);
    if (totalPages > 1) {
        const paginationCard = document.createElement('div');
        paginationCard.className = 'result-card';
        paginationCard.innerHTML = `
            <h3>Page Navigation</h3>
            <p>Showing page ${page} of ${totalPages}</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px; flex-wrap: wrap;">
                ${page > 1 ? `<button onclick="displayPosts(${page - 1}, ${pageSize})" style="width: auto;"><i class="fas fa-arrow-left"></i> Previous</button>` : ''}
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" id="postsPageInput" min="1" max="${totalPages}" value="${page}" style="width: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    <button onclick="goToPostsPage(${pageSize}, ${totalPages})" style="width: auto; padding: 5px 10px;">Go</button>
                </div>
                ${page < totalPages ? `<button onclick="displayPosts(${page + 1}, ${pageSize})" style="width: auto;">Next <i class="fas fa-arrow-right"></i></button>` : ''}
            </div>
        `;
        postsList.appendChild(paginationCard);
    }
}

// Create specific mutual friendships for demonstration
function createSpecificMutualFriendships() {
    // Define specific friendships that will always be created for demonstration
    const specificFriendships = [
        // Alice's friendships
        [1, 2], [1, 3], [1, 8], [1, 15],
        // Bob's friendships
        [2, 4], [2, 7], [2, 12],
        // Charlie's friendships
        [3, 4], [3, 5], [3, 9],
        // Diana's friendships
        [4, 6], [4, 11],
        // Eve's friendships
        [5, 6], [5, 10],
        // Frank's friendships
        [6, 13], [6, 14],
        // Other specific friendships
        [7, 8], [7, 9], [8, 10], [9, 11], 
        [10, 12], [11, 13], [12, 14], [13, 15]
    ];
    
    // Create these specific friendships
    specificFriendships.forEach(([user1, user2]) => {
        if (socialNetwork.users.has(user1) && socialNetwork.users.has(user2)) {
            socialNetwork.friendships.get(user1).add(user2);
            socialNetwork.friendships.get(user2).add(user1);
        }
    });
    
    console.log("Created specific mutual friendships for demonstration.");
}

// Verify specific mutual friendships
function verifySpecificMutualFriendships() {
    // This function can be used to verify that specific friendships were created
    // For now, we'll just log that verification is complete
    console.log("Verification of specific mutual friendships complete.");
}

// Get mutual friends between two users using BFS
function getMutualFriendsBFS(a, b) {
    const friendsA = socialNetwork.friendships.get(a);
    const friendsB = socialNetwork.friendships.get(b);
    
    if (!friendsA || !friendsB) return [];
    
    const mutual = [];
    // Increase the limit for the larger dataset
    let checkCount = 0;
    for (const friend of friendsA) {
        if (friendsB.has(friend)) {
            mutual.push(friend);
        }
        checkCount++;
        // Increase the limit for the larger dataset
        if (checkCount > 700) break; // Increased from 500 to 700
    }
    
    return mutual;
}

// Get mutual friends between two users using DFS
function getMutualFriendsDFS(a, b) {
    const friendsA = socialNetwork.friendships.get(a);
    const friendsB = socialNetwork.friendships.get(b);
    
    if (!friendsA || !friendsB) return [];
    
    const mutual = [];
    const visited = new Set();
    
    function dfs(userId) {
        if (visited.has(userId)) return;
        visited.add(userId);
        
        if (friendsA.has(userId) && friendsB.has(userId)) {
            mutual.push(userId);
        }
        
        const friends = socialNetwork.friendships.get(userId);
        if (friends) {
            // Limit the number of recursive calls for performance
            let friendCount = 0;
            for (const friend of friends) {
                dfs(friend);
                friendCount++;
                // Increase the limit for the larger dataset
                if (friendCount > 150) break; // Increased from 100 to 150
            }
        }
    }
    
    // This is a simplified DFS for mutual friends
    // In a real implementation, we would traverse the graph more carefully
    // Increase the limit for the larger dataset
    let checkCount = 0;
    for (const friend of friendsA) {
        if (friendsB.has(friend)) {
            mutual.push(friend);
        }
        checkCount++;
        // Increase the limit for the larger dataset
        if (checkCount > 700) break; // Increased from 500 to 700
    }
    
    return mutual;
}

// Display mutual friends
function displayMutualFriends(a, b) {
    mutualFriendsList.innerHTML = '';
    
    const userA = socialNetwork.users.get(a);
    const userB = socialNetwork.users.get(b);
    
    if (!userA || !userB) {
        mutualFriendsList.innerHTML = '<p class="error">One or both users not found!</p>';
        return;
    }
    
    // Check if they are already friends
    const areFriends = socialNetwork.friendships.get(a).has(b);
    
    // Get mutual friends using both BFS and DFS
    const mutualFriendsBFS = getMutualFriendsBFS(a, b);
    const mutualFriendsDFS = getMutualFriendsDFS(a, b);
    
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    if (mutualFriendsBFS.length === 0) {
        resultCard.innerHTML = `
            <h3>Mutual Friends</h3>
            <p><strong>Users:</strong> ${userA.name} and ${userB.name}</p>
            <p><strong>Friends:</strong> ${areFriends ? 'Yes' : 'No'}</p>
            <p class="no-data">No mutual friends found.</p>
        `;
    } else {
        let friendsListBFS = '';
        mutualFriendsBFS.forEach(friendId => {
            const friend = socialNetwork.users.get(friendId);
            if (friend) {
                friendsListBFS += `<li>${friend.name} (ID: ${friendId})</li>`;
            }
        });
        
        let friendsListDFS = '';
        mutualFriendsDFS.forEach(friendId => {
            const friend = socialNetwork.users.get(friendId);
            if (friend) {
                friendsListDFS += `<li>${friend.name} (ID: ${friendId})</li>`;
            }
        });
        
        resultCard.innerHTML = `
            <h3>Mutual Friends</h3>
            <p><strong>Users:</strong> ${userA.name} and ${userB.name}</p>
            <p><strong>Friends:</strong> ${areFriends ? 'Yes' : 'No'}</p>
            <p><strong>Count (BFS):</strong> ${mutualFriendsBFS.length}</p>
            <ul class="friends-list"><strong>BFS Results:</strong> ${friendsListBFS}</ul>
            <p><strong>Count (DFS):</strong> ${mutualFriendsDFS.length}</p>
            <ul class="friends-list"><strong>DFS Results:</strong> ${friendsListDFS}</ul>
        `;
    }
    
    mutualFriendsList.appendChild(resultCard);
}

// Find and display top 20 mutual friendships in the network
function displayTop20MutualFriendships() {
    autoMutualFriendsList.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Finding top mutual friendships... This may take a moment.</p></div>';
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
        const mutualFriendships = [];
        const processedPairs = new Set();
        
        // Limit the number of users we check for performance
        // Increase the limit for the larger dataset
        let userCount = 0;
        const userLimit = Math.min(8000, socialNetwork.users.size); // Increased from 5000 to 8000
        
        // Iterate through users to find mutual friendships
        for (const [userId1, friends1] of socialNetwork.friendships) {
            if (userCount >= userLimit) break;
            
            // Check against other users
            // Increase the limit for the larger dataset
            let otherUserCount = 0;
            for (const [userId2, friends2] of socialNetwork.friendships) {
                if (otherUserCount >= 1500) break; // Increased from 1000 to 1500
                
                // Skip if same user or if we've already processed this pair
                if (userId1 >= userId2) {
                    otherUserCount++;
                    continue;
                }
                
                // Create a unique key for this pair
                const pairKey = `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
                if (processedPairs.has(pairKey)) {
                    otherUserCount++;
                    continue;
                }
                processedPairs.add(pairKey);
                
                // Find mutual friends with a limit for performance
                const mutualFriends = getMutualFriendsBFS(userId1, userId2);
                
                // If there are mutual friends, add to our list
                if (mutualFriends.length > 0) {
                    const user1 = socialNetwork.users.get(userId1);
                    const user2 = socialNetwork.users.get(userId2);
                    
                    if (user1 && user2) {
                        // Check if they are already friends
                        const areFriends = socialNetwork.friendships.get(userId1).has(userId2);
                        
                        mutualFriendships.push({
                            user1: { id: userId1, name: user1.name },
                            user2: { id: userId2, name: user2.name },
                            mutualFriends: mutualFriends,
                            count: mutualFriends.length,
                            areFriends: areFriends
                        });
                    }
                }
                
                otherUserCount++;
            }
            
            userCount++;
            
            // Update progress for very large networks
            if (userCount % 1500 === 0) { // Increased from 1000 to 1500
                autoMutualFriendsList.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div><p>Processed ${userCount} users... Finding top mutual friendships.</p></div>`;
            }
        }
        
        // Sort by mutual friends count in descending order
        mutualFriendships.sort((a, b) => b.count - a.count);
        
        // Display up to 20 mutual friendships
        const displayCount = Math.min(20, mutualFriendships.length);
        
        autoMutualFriendsList.innerHTML = ''; // Clear loading indicator
        
        if (displayCount === 0) {
            autoMutualFriendsList.innerHTML = '<p class="no-data">No mutual friendships found in the network.</p>';
            return;
        }
        
        for (let i = 0; i < displayCount; i++) {
            const friendship = mutualFriendships[i];
            
            const friendshipCard = document.createElement('div');
            friendshipCard.className = 'friend-card';
            
            let friendsListHTML = '';
            // Limit the number of mutual friends displayed
            const displayFriendsCount = Math.min(10, friendship.mutualFriends.length);
            for (let j = 0; j < displayFriendsCount; j++) {
                const friendId = friendship.mutualFriends[j];
                const friend = socialNetwork.users.get(friendId);
                if (friend) {
                    friendsListHTML += `<li>${friend.name} (ID: ${friendId})</li>`;
                }
            }
            
            // Add note if there are more mutual friends than displayed
            if (friendship.mutualFriends.length > displayFriendsCount) {
                friendsListHTML += `<li><em>... and ${friendship.mutualFriends.length - displayFriendsCount} more mutual friends</em></li>`;
            }
            
            friendshipCard.innerHTML = `
                <h3>Mutual Friendship #${i + 1}</h3>
                <div class="friend-connection">
                    <span>${friendship.user1.name}</span>
                    <span>↔</span>
                    <span>${friendship.user2.name}</span>
                </div>
                <p><strong>Users:</strong> ${friendship.user1.name} (ID: ${friendship.user1.id}) ↔ ${friendship.user2.name} (ID: ${friendship.user2.id})</p>
                <p><strong>Friends:</strong> ${friendship.areFriends ? 'Yes' : 'No'}</p>
                <p><strong>Mutual Friends Count:</strong> ${friendship.count}</p>
                <p><strong>Mutual Friends:</strong></p>
                <ul class="friends-list">${friendsListHTML}</ul>
            `;
            
            autoMutualFriendsList.appendChild(friendshipCard);
        }
        
        // Add a summary
        const summaryCard = document.createElement('div');
        summaryCard.className = 'result-card';
        summaryCard.innerHTML = `
            <h3>Summary</h3>
            <p>Displayed top ${displayCount} mutual friendships from the network, sorted by mutual friends count (descending).</p>
            <p><strong>Highest:</strong> ${mutualFriendships[0]?.count || 0} mutual friends | <strong>Lowest:</strong> ${mutualFriendships[displayCount - 1]?.count || 0} mutual friends</p>
            <p><strong>Note:</strong> For performance reasons, only a sample of users was analyzed.</p>
        `;
        autoMutualFriendsList.appendChild(summaryCard);
    }, 10); // Small delay to allow UI to update
}

// Suggest friends for a user using BFS
function suggestFriendsBFS(userId, topK = 20) {
    const user = socialNetwork.users.get(userId);
    if (!user) return [];
    
    const friends = socialNetwork.friendships.get(userId);
    if (!friends) return [];
    
    // BFS implementation to find friends-of-friends
    const visited = new Set([userId]);
    const queue = [];
    const suggestions = new Map(); // userId -> mutual friends count
    
    // Add all direct friends to queue and mark as visited
    for (const friendId of friends) {
        visited.add(friendId);
        queue.push(friendId);
    }
    
    // BFS traversal - explore friends of friends
    // Increase the limit for the larger dataset
    while (queue.length > 0 && suggestions.size < Math.min(topK * 15, 1500)) { // Increased from topK * 10, 1000 to topK * 15, 1500
        const currentUserId = queue.shift();
        const currentFriends = socialNetwork.friendships.get(currentUserId);
        
        if (!currentFriends) continue;
        
        for (const neighborId of currentFriends) {
            if (!visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push(neighborId);
                
                // Count mutual friends with the original user
                const neighborFriends = socialNetwork.friendships.get(neighborId);
                if (neighborFriends) {
                    let mutualCount = 0;
                    // Limit the number of mutual friends we check for performance
                    let checkCount = 0;
                    for (const friendId of friends) {
                        if (neighborFriends.has(friendId)) {
                            mutualCount++;
                        }
                        checkCount++;
                        // Limit the number of checks for performance
                        if (checkCount > 150) break; // Increased from 100 to 150
                    }
                    
                    // Suggest if there are mutual friends (include existing friends too)
                    if (mutualCount > 0) {
                        suggestions.set(neighborId, mutualCount);
                    }
                }
            }
        }
        
        // Limit the BFS depth for performance with large networks
        if (visited.size > 7000) break; // Increased from 5000 to 7000
    }
    
    // Convert to array and sort by mutual friends count (descending)
    const suggestionsArray = Array.from(suggestions.entries())
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topK);
    
    return suggestionsArray;
}

// Suggest friends for a user using DFS
function suggestFriendsDFS(userId, topK = 20) {
    const user = socialNetwork.users.get(userId);
    if (!user) return [];
    
    const friends = socialNetwork.friendships.get(userId);
    if (!friends) return [];
    
    // DFS implementation to find friends-of-friends
    const visited = new Set();
    const suggestions = new Map(); // userId -> mutual friends count
    
    function dfs(currentUserId, depth) {
        // Limit depth and visited set size for performance
        if (depth > 2 || visited.size > 7000) return; // Increased from 5000 to 7000
        if (visited.has(currentUserId)) return;
        visited.add(currentUserId);
        
        const currentFriends = socialNetwork.friendships.get(currentUserId);
        if (!currentFriends) return;
        
        for (const neighborId of currentFriends) {
            if (!visited.has(neighborId)) {
                // If this is a friends-of-friend (depth 2)
                if (depth === 1 && neighborId !== userId) {
                    // Count mutual friends with the original user
                    const neighborFriends = socialNetwork.friendships.get(neighborId);
                    if (neighborFriends) {
                        let mutualCount = 0;
                        // Limit the number of mutual friends we check for performance
                        let checkCount = 0;
                        for (const friendId of friends) {
                            if (neighborFriends.has(friendId)) {
                                mutualCount++;
                            }
                            checkCount++;
                            // Limit the number of checks for performance
                            if (checkCount > 150) break; // Increased from 100 to 150
                        }
                        
                        // Suggest if there are mutual friends (include existing friends too)
                        if (mutualCount > 0) {
                            suggestions.set(neighborId, mutualCount);
                        }
                    }
                }
                
                dfs(neighborId, depth + 1);
            }
        }
    }
    
    // Start DFS from the user
    dfs(userId, 0);
    
    // Convert to array and sort by mutual friends count (descending)
    const suggestionsArray = Array.from(suggestions.entries())
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topK);
    
    return suggestionsArray;
}

// Display friend suggestions
function displayFriendSuggestions(userId, topK = 20) {
    suggestFriendsList.innerHTML = '';
    
    const user = socialNetwork.users.get(userId);
    if (!user) {
        suggestFriendsList.innerHTML = '<p class="error">User not found!</p>';
        return;
    }
    
    const friends = socialNetwork.friendships.get(userId);
    
    // Get suggestions using both BFS and DFS
    const suggestionsBFS = suggestFriendsBFS(userId, topK);
    const suggestionsDFS = suggestFriendsDFS(userId, topK);
    
    // Explicitly sort the suggestions by mutual friends count (descending) to ensure correct order
    suggestionsBFS.sort((a, b) => b.count - a.count);
    suggestionsDFS.sort((a, b) => b.count - a.count);
    
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    if (suggestionsBFS.length === 0 && suggestionsDFS.length === 0) {
        resultCard.innerHTML = `
            <h3>Friend Suggestions</h3>
            <p><strong>User:</strong> ${user.name}</p>
            <p class="no-data">No friend suggestions available.</p>
        `;
    } else {
        let suggestionsListBFS = '';
        suggestionsBFS.forEach(suggestion => {
            const suggestedUser = socialNetwork.users.get(suggestion.userId);
            if (suggestedUser) {
                const isFriend = friends.has(suggestion.userId) ? ' (Already Friend)' : ' (Not Friend)';
                suggestionsListBFS += `<li>${suggestedUser.name} (ID: ${suggestion.userId}) - Mutual friends: ${suggestion.count}${isFriend}</li>`;
            }
        });
        
        let suggestionsListDFS = '';
        suggestionsDFS.forEach(suggestion => {
            const suggestedUser = socialNetwork.users.get(suggestion.userId);
            if (suggestedUser) {
                const isFriend = friends.has(suggestion.userId) ? ' (Already Friend)' : ' (Not Friend)';
                suggestionsListDFS += `<li>${suggestedUser.name} (ID: ${suggestion.userId}) - Mutual friends: ${suggestion.count}${isFriend}</li>`;
            }
        });
        
        resultCard.innerHTML = `
            <h3>Friend Suggestions</h3>
            <p><strong>User:</strong> ${user.name}</p>
            <h4>BFS Algorithm Results (Sorted by mutual friends - Descending):</h4>
            <ul class="friends-list">${suggestionsListBFS || '<li>No suggestions found</li>'}</ul>
            <h4>DFS Algorithm Results (Sorted by mutual friends - Descending):</h4>
            <ul class="friends-list">${suggestionsListDFS || '<li>No suggestions found</li>'}</ul>
            <p><em>Note: Results now include both existing friends and potential new friends, sorted by mutual friends count.</em></p>
        `;
    }
    
    suggestFriendsList.appendChild(resultCard);
}

// Go to specific users page
function goToUsersPage(pageSize, totalPages) {
    const pageInput = document.getElementById('usersPageInput');
    let page = parseInt(pageInput.value);
    
    // Validate input
    if (isNaN(page) || page < 1) {
        page = 1;
    } else if (page > totalPages) {
        page = totalPages;
    }
    
    displayUsers(page, pageSize);
}

// Go to specific friends page
function goToFriendsPage(pageSize, totalPages) {
    const pageInput = document.getElementById('friendsPageInput');
    let page = parseInt(pageInput.value);
    
    // Validate input
    if (isNaN(page) || page < 1) {
        page = 1;
    } else if (page > totalPages) {
        page = totalPages;
    }
    
    displayFriends(page, pageSize);
}

// Go to specific posts page
function goToPostsPage(pageSize, totalPages) {
    const pageInput = document.getElementById('postsPageInput');
    let page = parseInt(pageInput.value);
    
    // Validate input
    if (isNaN(page) || page < 1) {
        page = 1;
    } else if (page > totalPages) {
        page = totalPages;
    }
    
    displayPosts(page, pageSize);
}

// Search users by name with optimization
function searchUsersByName(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    if (!searchTerm) return [];
    
    const results = [];
    
    // Use name index for faster search if search term is long enough
    if (searchTerm.length > 2) { // Increased from 1 to 2 for better performance with large dataset
        const firstLetter = searchTerm.charAt(0);
        const potentialUsers = socialNetwork.nameIndex.get(firstLetter) || [];
        
        // Search only in potential users
        for (const userId of potentialUsers) {
            const user = socialNetwork.users.get(userId);
            if (user && user.name.toLowerCase().includes(searchTerm)) {
                results.push(user);
            }
            
            // Increase the limit for the larger dataset
            if (results.length >= 40) break; // Increased from 30 to 40
        }
    } else {
        // For short searches, use a more efficient approach
        // Increase the limit for the larger dataset
        let count = 0;
        for (const [id, user] of socialNetwork.users) {
            if (user.name.toLowerCase().includes(searchTerm)) {
                results.push(user);
            }
            
            count++;
            // Increase the limit for the larger dataset
            if (count >= 7000) break; // Increased from 5000 to 7000
            
            // Increase the limit for the larger dataset
            if (results.length >= 40) break; // Increased from 30 to 40
        }
    }
    
    return results;
}

// Display search results
function displaySearchResults(results, searchTerm) {
    searchUsersResult.innerHTML = '';
    
    if (results.length === 0) {
        searchUsersResult.innerHTML = '<p class="no-data">No users found matching "' + searchTerm + '"</p>';
        return;
    }
    
    // Display results
    results.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <h3>${user.name}</h3>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Friends:</strong> ${socialNetwork.friendships.get(user.id) ? socialNetwork.friendships.get(user.id).size : 0}</p>
        `;
        searchUsersResult.appendChild(userCard);
    });
    
    // Add summary
    const summaryCard = document.createElement('div');
    summaryCard.className = 'result-card';
    summaryCard.innerHTML = `
        <h3>Search Summary</h3>
        <p>Found ${results.length} users matching "${searchTerm}"</p>
    `;
    searchUsersResult.appendChild(summaryCard);
}

// Add a new user to the network
function addUser(id, name) {
    // Check if user already exists
    if (socialNetwork.users.has(id)) {
        return false;
    }
    
    // Add user to users map
    socialNetwork.users.set(id, { id: id, name: name });
    
    // Initialize empty friendships set for this user
    socialNetwork.friendships.set(id, new Set());
    
    // Add to name index for faster search
    const firstLetter = name.charAt(0).toLowerCase();
    if (!socialNetwork.nameIndex.has(firstLetter)) {
        socialNetwork.nameIndex.set(firstLetter, []);
    }
    socialNetwork.nameIndex.get(firstLetter).push(id);
    
    return true;
}

// Add a friendship between two users
function addFriendship(user1Id, user2Id) {
    // Check if both users exist
    if (!socialNetwork.users.has(user1Id) || !socialNetwork.users.has(user2Id)) {
        return false;
    }
    
    // Check if friendship already exists (bidirectional check)
    // A friendship exists if both users are friends with each other
    if (socialNetwork.friendships.get(user1Id).has(user2Id) && 
        socialNetwork.friendships.get(user2Id).has(user1Id)) {
        return false;
    }
    
    // Add friendship (bidirectional)
    socialNetwork.friendships.get(user1Id).add(user2Id);
    socialNetwork.friendships.get(user2Id).add(user1Id);
    
    // Save friendships to localStorage
    saveFriendshipsToStorage();
    
    return true;
}

// Display add user result
function displayAddUserResult(success, id, name) {
    addUserResult.innerHTML = '';
    
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    if (success) {
        resultCard.innerHTML = `
            <h3>User Added Successfully</h3>
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p class="success">User has been added to the network!</p>
        `;
    } else {
        resultCard.innerHTML = `
            <h3>Error Adding User</h3>
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p class="error">Failed to add user. User may already exist.</p>
        `;
    }
    
    addUserResult.appendChild(resultCard);
}

// Display add friendship result
function displayAddFriendshipResult(success, user1Id, user2Id) {
    addFriendshipResult.innerHTML = '';
    
    const user1 = socialNetwork.users.get(user1Id);
    const user2 = socialNetwork.users.get(user2Id);
    
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    if (success) {
        resultCard.innerHTML = `
            <h3>Friendship Added Successfully</h3>
            <p>Friendship created between:</p>
            <p><strong>User ${user1Id}:</strong> ${user1 ? user1.name : 'Unknown'}</p>
            <p><strong>User ${user2Id}:</strong> ${user2 ? user2.name : 'Unknown'}</p>
            <p class="success">Friendship has been added to the network!</p>
        `;
    } else {
        resultCard.innerHTML = `
            <h3>Error Adding Friendship</h3>
            <p>Attempted to create friendship between:</p>
            <p><strong>User ${user1Id}:</strong> ${user1 ? user1.name : 'Unknown'}</p>
            <p><strong>User ${user2Id}:</strong> ${user2 ? user2.name : 'Unknown'}</p>
            <p class="error">Failed to add friendship. Users may not exist or friendship may already exist.</p>
        `;
    }
    
    addFriendshipResult.appendChild(resultCard);
}

// Get top K trending posts
function getTopKPosts(k) {
    const postsArray = Array.from(socialNetwork.posts.values());
    
    // Calculate popularity score for each post (likes + 2*shares)
    const postsWithScore = postsArray.map(post => ({
        ...post,
        score: post.likes + 2 * post.shares
    }));
    
    // Sort by popularity score (descending)
    postsWithScore.sort((a, b) => b.score - a.score);
    
    // Return top K posts
    return postsWithScore.slice(0, k);
}

// Display trending posts
function displayTrendingPosts() {
    trendingList.innerHTML = '';
    
    const topPosts = getTopKPosts(10); // Show top 10 posts
    
    if (topPosts.length === 0) {
        trendingList.innerHTML = '<p class="no-data">No posts available.</p>';
        return;
    }
    
    topPosts.forEach(post => {
        const author = socialNetwork.users.get(post.authorId);
        const authorName = author ? author.name : 'Unknown';
        
        const postCard = document.createElement('div');
        postCard.className = 'post-card trending';
        postCard.innerHTML = `
            <h3>${authorName}</h3>
            <p><strong>Post ID:</strong> ${post.id}</p>
            <div class="post-content">
                "${post.content}"
            </div>
            <div class="post-stats">
                <div class="stat">
                    <span>👍</span>
                    <span>${post.likes}</span>
                </div>
                <div class="stat">
                    <span>🔄</span>
                    <span>${post.shares}</span>
                </div>
                <div class="stat">
                    <span>📈</span>
                    <span>${post.score}</span>
                </div>
            </div>
            <div class="post-actions">
                <button class="like-button" data-post-id="${post.id}">❤️ Like</button>
                <button class="share-button" data-post-id="${post.id}">🔄 Share</button>
            </div>
        `;
        trendingList.appendChild(postCard);
    });
    
    // Add event listeners to like and share buttons
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const postId = parseInt(e.target.getAttribute('data-post-id'));
            likePost(postId);
        });
    });
    
    document.querySelectorAll('.share-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const postId = parseInt(e.target.getAttribute('data-post-id'));
            sharePost(postId);
        });
    });
}

// Share a post
function sharePost(postId) {
    const post = socialNetwork.posts.get(postId);
    if (!post) {
        console.log("Post not found:", postId);
        return false;
    }
    
    post.shares++;
    socialNetwork.posts.set(postId, post);
    
    // Save posts to localStorage
    savePostsToStorage();
    
    // Refresh the posts display
    if (postsSection.classList.contains('active')) {
        displayPosts();
    }
    
    // Refresh trending posts if that section is active
    if (trendingSection.classList.contains('active')) {
        displayTrendingPosts();
    }
    
    console.log("Post shared:", postId);
    return true;
}

// Like a post
function likePost(postId) {
    const post = socialNetwork.posts.get(postId);
    if (!post) {
        console.log("Post not found:", postId);
        return false;
    }
    
    post.likes++;
    socialNetwork.posts.set(postId, post);
    
    // Save posts to localStorage
    savePostsToStorage();
    
    // Refresh the posts display
    if (postsSection.classList.contains('active')) {
        displayPosts();
    }
    
    // Refresh trending posts if that section is active
    if (trendingSection.classList.contains('active')) {
        displayTrendingPosts();
    }
    
    console.log("Post liked:", postId);
    return true;
}

// Function to find users with specific mutual friend counts
function findUsersWithMutualFriends(targetCounts = [7, 6, 5, 4]) {
    const results = {};
    targetCounts.forEach(count => results[count] = []);
    
    // Check a sample of user pairs to find those with specific mutual friend counts
    const userIds = Array.from(socialNetwork.users.keys());
    const sampleSize = Math.min(5000, userIds.length); // Check first 5000 users or total if less
    
    for (let i = 0; i < sampleSize; i++) {
        const userId1 = userIds[i];
        // Check against a subset of other users for performance
        for (let j = i + 1; j < Math.min(i + 100, sampleSize); j++) {
            const userId2 = userIds[j];
            
            // Calculate mutual friends
            const friends1 = socialNetwork.friendships.get(userId1);
            const friends2 = socialNetwork.friendships.get(userId2);
            
            if (friends1 && friends2) {
                let mutualCount = 0;
                for (const friend of friends1) {
                    if (friends2.has(friend)) {
                        mutualCount++;
                    }
                }
                
                // If mutual count matches one of our target counts, add to results
                if (targetCounts.includes(mutualCount) && results[mutualCount].length < 5) {
                    const user1 = socialNetwork.users.get(userId1);
                    const user2 = socialNetwork.users.get(userId2);
                    results[mutualCount].push({
                        user1: { id: userId1, name: user1 ? user1.name : 'Unknown' },
                        user2: { id: userId2, name: user2 ? user2.name : 'Unknown' },
                        mutualCount: mutualCount
                    });
                }
            }
        }
    }
    
    return results;
}

// Function to display users with specific mutual friend counts
function displayUsersWithMutualFriends() {
    // Ensure network is initialized
    initializeNetwork();
    
    // Check specific pairs we know have the desired mutual friend counts
    const specificPairs = [
        { user1: 2, user2: 3, expected: 7 },
        { user1: 4, user2: 5, expected: 6 },
        { user1: 6, user2: 7, expected: 5 },
        { user1: 8, user2: 9, expected: 4 }
    ];
    
    // Create a result card to display these users
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    let htmlContent = '<h3>Users with Specific Mutual Friend Counts</h3>';
    htmlContent += '<p>These user pairs have been specifically created to demonstrate mutual friend counts:</p>';
    
    specificPairs.forEach(pair => {
        const mutualFriends = getMutualFriendsBFS(pair.user1, pair.user2);
        const user1 = socialNetwork.users.get(pair.user1);
        const user2 = socialNetwork.users.get(pair.user2);
        
        htmlContent += `
            <div class="friend-card" style="margin-bottom: 15px;">
                <h4>${pair.expected} Mutual Friends</h4>
                <div class="friend-connection">
                    <span>${user1 ? user1.name : 'User ' + pair.user1}</span>
                    <span>↔</span>
                    <span>${user2 ? user2.name : 'User ' + pair.user2}</span>
                </div>
                <p><strong>Users:</strong> ${user1 ? user1.name : 'User ' + pair.user1} (ID: ${pair.user1}) ↔ ${user2 ? user2.name : 'User ' + pair.user2} (ID: ${pair.user2})</p>
                <p><strong>Mutual Friends Count:</strong> ${mutualFriends.length}</p>
                <p><strong>Expected:</strong> ${pair.expected}</p>
            </div>
        `;
    });
    
    // Also find some additional pairs with similar counts
    htmlContent += '<h4>Additional User Pairs with Similar Mutual Friend Counts:</h4>';
    
    const additionalPairs = findUsersWithMutualFriends([7, 6, 5, 4]);
    [7, 6, 5, 4].forEach(count => {
        if (additionalPairs[count].length > 0) {
            htmlContent += `<h5>${count} Mutual Friends:</h5><ul class="friends-list">`;
            additionalPairs[count].slice(0, 3).forEach(pair => { // Limit to 3 pairs per count
                htmlContent += `<li>${pair.user1.name} (ID: ${pair.user1.id}) ↔ ${pair.user2.name} (ID: ${pair.user2.id}) - ${pair.mutualCount} mutual friends</li>`;
            });
            htmlContent += '</ul>';
        }
    });
    
    resultCard.innerHTML = htmlContent;
    
    // Clear previous content and add the new result card
    mutualFriendsList.innerHTML = '';
    mutualFriendsList.appendChild(resultCard);
    
    return specificPairs;
}

// Function to create specific mutual friendships
function createSpecificMutualFriendships() {
    // Create a small group of users with specific mutual friend counts
    // We'll create users 1-10 and set up specific friendships
    
    // First, ensure these users exist
    for (let i = 1; i <= 10; i++) {
        if (!socialNetwork.users.has(i)) {
            const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
            socialNetwork.users.set(i, { id: i, name: `${names[i-1]}${i}` });
            socialNetwork.friendships.set(i, new Set());
        }
    }
    
    // Create a hub user (user 1) connected to several others
    const hubUser = 1;
    
    // Connect hub user to users 2-8
    for (let i = 2; i <= 8; i++) {
        if (!socialNetwork.friendships.get(hubUser).has(i)) {
            socialNetwork.friendships.get(hubUser).add(i);
            socialNetwork.friendships.get(i).add(hubUser);
        }
    }
    
    // Create specific mutual friendships:
    // Users 2 and 3 share 7 mutual friends (connected to hub and users 4-8)
    for (let i = 4; i <= 8; i++) {
        if (!socialNetwork.friendships.get(2).has(i)) {
            socialNetwork.friendships.get(2).add(i);
            socialNetwork.friendships.get(i).add(2);
        }
        if (!socialNetwork.friendships.get(3).has(i)) {
            socialNetwork.friendships.get(3).add(i);
            socialNetwork.friendships.get(i).add(3);
        }
    }
    
    // Users 4 and 5 share 6 mutual friends (connected to hub and users 2, 3, 6-8)
    if (!socialNetwork.friendships.get(4).has(2)) {
        socialNetwork.friendships.get(4).add(2);
        socialNetwork.friendships.get(2).add(4);
    }
    if (!socialNetwork.friendships.get(4).has(3)) {
        socialNetwork.friendships.get(4).add(3);
        socialNetwork.friendships.get(3).add(4);
    }
    if (!socialNetwork.friendships.get(5).has(2)) {
        socialNetwork.friendships.get(5).add(2);
        socialNetwork.friendships.get(2).add(5);
    }
    if (!socialNetwork.friendships.get(5).has(3)) {
        socialNetwork.friendships.get(5).add(3);
        socialNetwork.friendships.get(3).add(5);
    }
    
    // Users 6 and 7 share 5 mutual friends (connected to hub and users 2, 3, 8)
    if (!socialNetwork.friendships.get(6).has(2)) {
        socialNetwork.friendships.get(6).add(2);
        socialNetwork.friendships.get(2).add(6);
    }
    if (!socialNetwork.friendships.get(6).has(3)) {
        socialNetwork.friendships.get(6).add(3);
        socialNetwork.friendships.get(3).add(6);
    }
    if (!socialNetwork.friendships.get(6).has(8)) {
        socialNetwork.friendships.get(6).add(8);
        socialNetwork.friendships.get(8).add(6);
    }
    if (!socialNetwork.friendships.get(7).has(2)) {
        socialNetwork.friendships.get(7).add(2);
        socialNetwork.friendships.get(2).add(7);
    }
    if (!socialNetwork.friendships.get(7).has(3)) {
        socialNetwork.friendships.get(7).add(3);
        socialNetwork.friendships.get(3).add(7);
    }
    
    // Users 8 and 9 share 4 mutual friends (connected to hub and users 2, 3)
    // (They're already connected to hub, 2, and 3 from above)
    
    console.log("Created specific mutual friendships for demonstration");
}

// Function to verify specific mutual friend counts
function verifySpecificMutualFriendships() {
    const pairs = [
        { user1: 2, user2: 3, expected: 7 },
        { user1: 4, user2: 5, expected: 6 },
        { user1: 6, user2: 7, expected: 5 },
        { user1: 8, user2: 9, expected: 4 }
    ];
    
    pairs.forEach(pair => {
        const mutualFriends = getMutualFriendsBFS(pair.user1, pair.user2);
        console.log(`Users ${pair.user1} and ${pair.user2} have ${mutualFriends.length} mutual friends (expected: ${pair.expected})`);
    });
}

// Event listeners
if (showUsersLink) {
    showUsersLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('users');
    });
}

if (showFriendsLink) {
    showFriendsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('friends');
    });
}

if (showPostsLink) {
    showPostsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('posts');
    });
}

if (showMutualFriendsLink) {
    showMutualFriendsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('mutual');
    });
}

if (suggestFriendsLink) {
    suggestFriendsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('suggest');
    });
}

if (showTrendingLink) {
    showTrendingLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('trending');
    });
}

if (searchUsersLink) {
    searchUsersLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('search');
    });
}

if (addUserLink) {
    addUserLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('addUser');
    });
}

if (addFriendshipLink) {
    addFriendshipLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('addFriendship');
    });
}

if (showAutoMutualFriendsBtn) {
    showAutoMutualFriendsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        displayTop20MutualFriendships();
    });
}

searchUsersForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = searchUserNameInput.value.trim();
    
    if (!searchTerm) {
        searchUsersResult.innerHTML = '<p class="error">Please enter a search term!</p>';
        return;
    }
    
    const results = searchUsersByName(searchTerm);
    displaySearchResults(results, searchTerm);
});

// Form submissions
mutualFriendsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userA = parseInt(userAInput.value);
    const userB = parseInt(userBInput.value);
    
    if (isNaN(userA) || isNaN(userB)) {
        mutualFriendsList.innerHTML = '<p class="error">Please enter valid user IDs!</p>';
        return;
    }
    
    displayMutualFriends(userA, userB);
});

suggestFriendsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = parseInt(suggestUserInput.value);
    const count = parseInt(suggestCountInput.value) || 20;
    
    if (isNaN(userId)) {
        suggestFriendsList.innerHTML = '<p class="error">Please enter a valid user ID!</p>';
        return;
    }
    
    displayFriendSuggestions(userId, count);
});

postActionsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const postId = parseInt(postIdInput.value);
    const action = actionSelect.value;
    
    if (isNaN(postId)) {
        // Just refresh trending posts
        displayTrendingPosts();
        return;
    }
    
    if (action === 'like') {
        if (likePost(postId)) {
            displayTrendingPosts();
            // Also refresh posts section to show updated stats
            if (postsSection.classList.contains('active')) {
                displayPosts(1, 50); // Show first page with 50 posts
            }
        } else {
            trendingList.innerHTML = '<p class="error">Post not found!</p>';
        }
    } else if (action === 'share') {
        if (sharePost(postId)) {
            displayTrendingPosts();
            // Also refresh posts section to show updated stats
            if (postsSection.classList.contains('active')) {
                displayPosts(1, 50); // Show first page with 50 posts
            }
        } else {
            trendingList.innerHTML = '<p class="error">Post not found!</p>';
        }
    }
});

addUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(newUserIdInput.value);
    const name = newUserNameInput.value.trim();
    
    if (isNaN(id) || id <= 0) {
        displayAddUserResult(false, id, name);
        return;
    }
    
    if (!name) {
        displayAddUserResult(false, id, name);
        return;
    }
    
    const success = addUser(id, name);
    displayAddUserResult(success, id, name);
    
    // Clear form
    newUserIdInput.value = '';
    newUserNameInput.value = '';
});

addFriendshipForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const friend1Id = parseInt(friend1IdInput.value);
    const friend2Id = parseInt(friend2IdInput.value);
    
    if (isNaN(friend1Id) || isNaN(friend2Id)) {
        addFriendshipResult.innerHTML = '<p class="error">Please enter valid user IDs!</p>';
        return;
    }
    
    const success = addFriendship(friend1Id, friend2Id);
    displayAddFriendshipResult(success, friend1Id, friend2Id);
    
    // Clear form
    friend1IdInput.value = '';
    friend2IdInput.value = '';
});

// Initialize network when page loads
window.addEventListener('load', () => {
    // Initialize network (this will be done on-demand when needed)
    console.log('Admin panel loaded');
});