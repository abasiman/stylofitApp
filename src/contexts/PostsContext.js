// src/contexts/PostsContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  serverTimestamp
} from 'firebase/firestore';

const PostsContext = createContext();

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const user = auth.currentUser;

  // 1) Subscribe to all outfits (newest first)
  useEffect(() => {
    const q = query(collection(db, 'outfits'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // 2) Like / Unlike
  const likePost = async outfitId => {
    if (!user) return;
    const likeRef = doc(db, 'outfits', outfitId, 'likes', user.uid);
    await setDoc(likeRef, { timestamp: serverTimestamp() });
    await updateDoc(doc(db, 'outfits', outfitId), {
      likesCount: increment(1)
    });
  };
  const unlikePost = async outfitId => {
    if (!user) return;
    await deleteDoc(doc(db, 'outfits', outfitId, 'likes', user.uid));
    await updateDoc(doc(db, 'outfits', outfitId), {
      likesCount: increment(-1)
    });
  };

  // 3) Comments
  const addComment = async (outfitId, text) => {
    if (!user || !text.trim()) return;
    // create comment doc
    await addDoc(
      collection(db, 'outfits', outfitId, 'comments'),
      {
        userId:    user.uid,
        username:  user.displayName || 'Anonymous',
        text:      text.trim(),
        timestamp: serverTimestamp()
      }
    );
    // bump counter
    await updateDoc(doc(db, 'outfits', outfitId), {
      commentsCount: increment(1)
    });
  };

  // 4) Follow / Unfollow other users
  const followUser = async targetUid => {
    if (!user) return;
    // me follows them
    await setDoc(
      doc(db, 'users', targetUid, 'followers', user.uid),
      { timestamp: serverTimestamp() }
    );
    // me’s following list
    await setDoc(
      doc(db, 'users', user.uid, 'following', targetUid),
      { timestamp: serverTimestamp() }
    );
  };

  const unfollowUser = async targetUid => {
    if (!user) return;
    await deleteDoc(
      doc(db, 'users', targetUid, 'followers', user.uid)
    );
    await deleteDoc(
      doc(db, 'users', user.uid, 'following', targetUid)
    );
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        likePost,
        unlikePost,
        addComment,
        followUser,
        unfollowUser
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export const usePosts = () => useContext(PostsContext);
