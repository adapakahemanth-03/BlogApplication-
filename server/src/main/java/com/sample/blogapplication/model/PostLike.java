package com.sample.blogapplication.model;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "post_likes" , uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "post_id"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id",nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="post_id",nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Post post;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }
}
