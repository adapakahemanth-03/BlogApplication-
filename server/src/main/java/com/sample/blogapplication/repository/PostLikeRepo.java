package com.sample.blogapplication.repository;

import com.sample.blogapplication.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepo extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByUserIdAndPostId(Long userId, Long postId);
    List<PostLike> findByUserId(Long userId);
    long countByPostId(Long postId);
}
