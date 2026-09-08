package com.sample.blogapplication.controller;

import com.sample.blogapplication.model.User;
import com.sample.blogapplication.repository.PostLikeRepo;
import com.sample.blogapplication.service.PostLikeService;
import com.sample.blogapplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/likes")
public class LikeController {
    
    @Autowired
    private PostLikeService postLikeService;
    
    @Autowired
    private UserService userService;

    @Autowired
    private PostLikeRepo postLikeRepo;
    
    @PostMapping("/post/{postId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long postId, Authentication authentication) {
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        postLikeService.toggleLike(postId, user);
        long count = postLikeService.getLikeCount(postId);
        boolean liked = postLikeService.hasUserLikedPost(postId, user);

        Map<String, Object> response = new HashMap<>();
        response.put("postId", postId);
        response.put("likeCount", count);
        response.put("liked", liked);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/post/{postId}/count")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long postId) {
        long count = postLikeService.getLikeCount(postId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/post/{postId}/status")
    public ResponseEntity<Map<String, Object>> getLikeStatus(@PathVariable Long postId, Authentication authentication) {
        long count = postLikeService.getLikeCount(postId);
        boolean liked = false;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            String username = authentication.getName();
            User user = userService.getUserByUsername(username).orElse(null);
            if (user != null) {
                liked = postLikeService.hasUserLikedPost(postId, user);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("postId", postId);
        response.put("likeCount", count);
        response.put("liked", liked);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/liked")
    public ResponseEntity<List<Long>> getUserLikedPostIds(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.ok(List.of());
        }
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        List<Long> likedPostIds = postLikeRepo.findByUserId(user.getId())
                .stream()
                .map(pl -> pl.getPost().getId())
                .collect(Collectors.toList());
        return ResponseEntity.ok(likedPostIds);
    }
}

