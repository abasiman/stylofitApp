// src/contexts/PostsContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { auth, db } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

const noop = () => {};
const PostsContext = createContext({
  posts:         [],
  addPost:       noop,
  likePost:      noop,
  unlikePost:    noop,
  addComment:    noop,
  followUser:    noop,
  unfollowUser:  noop,
});

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const user = auth.currentUser;

  // 1️⃣ Load all outfits
  useEffect(() => {
    const q = query(
      collection(db, 'outfits'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // 2️⃣ Helpers
  const addPost = post => {
    setPosts(prev => [post, ...prev]);
  };

  const deletePost = async outfitId => {
    if (!user) return;
    // only the owner can delete; Firestore rules enforce this
    await deleteDoc(doc(db, 'outfits', outfitId));
  };


  const likePost = async outfitId => {
    if (!user) return;
    const likeRef = doc(db, 'outfits', outfitId, 'likes', user.uid);
    await setDoc(likeRef, { timestamp: serverTimestamp() });
    await updateDoc(doc(db, 'outfits', outfitId), {
      likesCount: increment(1),
    });
  };

  const unlikePost = async outfitId => {
    if (!user) return;
    await deleteDoc(doc(db, 'outfits', outfitId, 'likes', user.uid));
    await updateDoc(doc(db, 'outfits', outfitId), {
      likesCount: increment(-1),
    });
  };

  const addComment = async (outfitId, text) => {
    if (!user || !text.trim()) return;
    await addDoc(collection(db, 'outfits', outfitId, 'comments'), {
      userId:    user.uid,
      username:  user.displayName || 'Anonymous',
      text:      text.trim(),
      timestamp: serverTimestamp(),
    });
    await updateDoc(doc(db, 'outfits', outfitId), {
      commentsCount: increment(1),
    });
  };

  const followUser = async targetUid => {
    if (!user) return;
    // store follower info on the target's followers subcollection
    await setDoc(
      doc(db, 'users', targetUid, 'followers', user.uid),
      {
        timestamp:    serverTimestamp(),
        displayName:  user.displayName || '',
        photoURL:     user.photoURL    || null
      }
    );
    // store following info on the current user's following subcollection
    await setDoc(
      doc(db, 'users', user.uid, 'following', targetUid),
      {
        timestamp:    serverTimestamp(),
        displayName:  (await getDoc(doc(db, 'users', targetUid))).data()?.displayName || '',
        photoURL:     (await getDoc(doc(db, 'users', targetUid))).data()?.photoURL    || null
      }
    );
  };

  const unfollowUser = async targetUid => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', targetUid, 'followers', user.uid));
    await deleteDoc(doc(db, 'users', user.uid, 'following', targetUid));
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        addPost,
        likePost,
        unlikePost,
        addComment,
        followUser,
        deletePost, 
        unfollowUser,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export const usePosts = () => useContext(PostsContext);
