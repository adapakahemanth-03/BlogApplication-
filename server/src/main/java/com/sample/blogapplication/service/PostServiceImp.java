package com.sample.blogapplication.service;

import com.sample.blogapplication.model.Post;
import com.sample.blogapplication.model.User;
import com.sample.blogapplication.repository.PostRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostServiceImp implements PostService {
    @Autowired
    private PostRepo postRepo;

    @Override
    public Post createPost(Post post,User author) {
        post.setAuthor(author);
        return postRepo.save(post);
    }

    @Override
    public Post updatePost(Long id,Post UpdatedDetails,User currentUser) {
        Post existingPost = getPostById(id);
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));
        boolean isAuthor = existingPost.getAuthor().getId().equals(currentUser.getId());
        if(isAdmin || isAuthor){
            existingPost.setTitle(UpdatedDetails.getTitle());
            existingPost.setContent(UpdatedDetails.getContent());
            return postRepo.save(existingPost);
        } else {
            throw new RuntimeException("You do not have permission to update this post.");
        }
    }

    @Override
    public void deletePost(Long id,User currentUser) {
        Post existingPost = getPostById(id);
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));
        boolean isAuthor = existingPost.getAuthor().getId().equals(currentUser.getId());
        if(isAdmin || isAuthor){
            postRepo.delete(existingPost);
        } else {
            throw new RuntimeException("You do not have permission to delete this post.");
        }

    }


    @Override
    public Post getPostById(Long id) {
        return postRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));
    }

    @Override
    public List<Post> getAllPosts() {
        return postRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt", "id"));
    }
}
