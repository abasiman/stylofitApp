// src/contexts/PostsContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase';

const PostsContext = createContext();

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // 1) Build a query on the 'outfits' collection, ordered by timestamp desc
    const q = query(
      collection(db, 'outfits'),
      orderBy('createdAt', 'desc')
    );

    // 2) Subscribe with onSnapshot
    const unsubscribe = onSnapshot(q, snapshot => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(loaded);
    });

    // 3) Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Optional: keep for optimistic UI updates
  const addPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const likePost = (index) => {
    setPosts(prev => {
      const updated = [...prev];
      updated[index].likes = (updated[index].likes || 0) + 1;
      return updated;
    });
  };

  const unlikePost = (index) => {
    setPosts(prev => {
      const updated = [...prev];
      updated[index].likes = Math.max((updated[index].likes || 1) - 1, 0);
      return updated;
    });
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, likePost, unlikePost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
