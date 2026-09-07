package com.sample.blogapplication.service;

import com.sample.blogapplication.model.Comment;
import com.sample.blogapplication.model.Post;
import com.sample.blogapplication.model.User;
import com.sample.blogapplication.repository.CommentRepo;
import com.sample.blogapplication.repository.PostRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentServiceImp implements CommentService {
   @Autowired
   private CommentRepo commentRepo;

   @Autowired
   private PostRepo postRepo;

    @Override
    public List<Comment> getCommentsByPostId(Long id) {
        return commentRepo.findByPostIdOrderByCreatedAtDesc(id);
    }

    @Override
    public Comment addComment(Long id, Comment comment, User user) {
        Post post=postRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));
        comment.setAuthor(user);
        comment.setPost(post);
        return commentRepo.save(comment);
    }

    @Override
    public void deleteComment(Long commentId, User user) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));
        boolean isAuthor = comment.getAuthor().getId().equals(user.getId());
        if(isAdmin || isAuthor){
            commentRepo.delete(comment);
        } else {
            throw new RuntimeException("You do not have permission to delete this comment.");
        }

    }


}
