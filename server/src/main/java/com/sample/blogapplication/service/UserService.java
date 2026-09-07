package com.sample.blogapplication.service;

import com.sample.blogapplication.model.User;

import java.util.Optional;

public interface UserService {
    User registerUser(User user);
    Optional<User> getUserByUsername(String username);
}
