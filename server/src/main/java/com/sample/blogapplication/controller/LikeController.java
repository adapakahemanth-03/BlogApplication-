package com.sample.blogapplication.controller;

import com.sample.blogapplication.model.User;
import com.sample.blogapplication.service.PostLikeService;
import com.sample.blogapplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/likes")
public class LikeController {
    
    @Autowired
    private PostLikeService postLikeService;
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/post/{postId}/toggle")
    public ResponseEntity<Void> toggleLike(@PathVariable Long postId, Authentication authentication) {
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        postLikeService.toggleLike(postId, user);
        return ResponseEntity.status(HttpStatus.OK).build();
    }
    
    @GetMapping("/post/{postId}/count")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long postId) {
        long count = postLikeService.getLikeCount(postId);
        return ResponseEntity.ok(count);
    }
}
