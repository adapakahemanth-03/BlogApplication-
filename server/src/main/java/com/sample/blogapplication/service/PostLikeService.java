package com.sample.blogapplication.service;

import com.sample.blogapplication.model.User;

public interface PostLikeService {
    void toggleLike(Long postId, User user);
    long getLikeCount(Long postId);
    boolean hasUserLikedPost(Long postId, User user);
}
