package com.sample.blogapplication.service;

import com.sample.blogapplication.model.Post;
import com.sample.blogapplication.model.PostLike;
import com.sample.blogapplication.model.User;
import com.sample.blogapplication.repository.PostLikeRepo;
import com.sample.blogapplication.repository.PostRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
@Service
public class PostLikeServiceImp implements PostLikeService {

    @Autowired
    private PostRepo postRepo;
    @Autowired
    private PostLikeRepo postLikeRepo;

    @Override
    public void toggleLike(Long postId, User user) {
        Post post = postRepo.findById(postId)  // ✓ Use PostRepo
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        Optional<PostLike> postLikeOptional = postLikeRepo.findByUserIdAndPostId(user.getId(), postId);
        if(postLikeOptional.isPresent())  // ✓ Use correct variable name
        {
            postLikeRepo.delete(postLikeOptional.get());
        } else {
            PostLike newLike = new PostLike();
            newLike.setPost(post);
            newLike.setUser(user);
            postLikeRepo.save(newLike);
        }
    }

    @Override
    public long getLikeCount(Long postId) {
        return postLikeRepo.countByPostId(postId);
    }

    @Override
    public boolean hasUserLikedPost(Long postId, User user) {
        return postLikeRepo.findByUserIdAndPostId(user.getId(), postId).isPresent();
    }
}
