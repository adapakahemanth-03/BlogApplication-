package com.sample.blogapplication.service;

import com.sample.blogapplication.model.Post;
import com.sample.blogapplication.model.User;

import java.util.List;

public interface PostService {
    Post createPost(Post post, User user);
    Post updatePost(Long postId,Post updatedDetails,User currentUser);
    void deletePost(Long postId,User user);
    Post getPostById(Long id);
    List<Post> getAllPosts();

}
