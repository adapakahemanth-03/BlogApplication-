package com.sample.blogapplication.service;

import com.sample.blogapplication.model.Comment;
import com.sample.blogapplication.model.User;

import java.util.List;

public interface CommentService {
    Comment addComment(Long id, Comment comment, User user);
    void deleteComment(Long commentId, User user);
    List<Comment> getCommentsByPostId(Long postId);
}
