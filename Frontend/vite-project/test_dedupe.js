const getUniquePosts = (postsArray) => {
    if (!Array.isArray(postsArray)) return [];
    const seenIds = new Set();
    const seenSigs = new Set();
    const unique = [];

    for (const post of postsArray) {
        if (!post) continue;
        const id = post.postId || post.id || post.Id || post.PostId || post.ID;
        const normalizedId = id ? String(id).trim().toLowerCase() : null;

        const author = (post.author?.fullName || post.Author?.fullName || post.author?.authorName || post.Author?.authorName || 'anon').trim().toLowerCase();
        const content = (post.content || '').trim().replace(/^.*I'm feeling.*: /, '').replace(/[^a-z0-9]/gi, '').substring(0, 100);
        const signature = `sig-${author}-${content}`;

        const isIdDuplicate = normalizedId && seenIds.has(normalizedId);
        const isSigDuplicate = seenSigs.has(signature);

        if (!isIdDuplicate && !isSigDuplicate) {
            if (normalizedId) seenIds.add(normalizedId);
            seenSigs.add(signature);
            unique.push(post);
        }
    }
    return unique;
};

const prev = [
    { postId: "1", content: "hello", author: { fullName: "A" } }
];

const postData1 = { postId: "2", content: "hello", author: { fullName: "A" } };
const postData2 = { postId: "3", content: "hello", author: { fullName: "A" } };

// Double click scenario:
const next1 = getUniquePosts([postData1, ...prev]);
console.log("next1 length:", next1.length); // Should be 2 (postData1, prev)
const next2 = getUniquePosts([postData2, ...next1]);
console.log("next2 length:", next2.length); // Should be 2! (postData2 replaces postData1/prev because signature matches)

console.log(next2);
