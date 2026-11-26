package tn.sesame.driveeasy.client.dto;

public class ActiveLocationResponse {
    private boolean active;

    public ActiveLocationResponse() {}

    public ActiveLocationResponse(boolean active) {
        this.active = active;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
