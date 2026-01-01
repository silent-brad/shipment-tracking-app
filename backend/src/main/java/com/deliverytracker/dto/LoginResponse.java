package com.deliverytracker.dto;

public class LoginResponse {
    
    private String accessToken;
    private String tokenType;
    private String username;
    private String error;
    
    public LoginResponse() {}
    
    public LoginResponse(String accessToken, String tokenType, String username) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.username = username;
    }
    
    public LoginResponse(String accessToken, String tokenType, String username, String error) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.username = username;
        this.error = error;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public String getTokenType() {
        return tokenType;
    }
    
    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
}
