package tn.sesame.driveeasy.client.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ClientHasActiveLocationException extends RuntimeException {
    public ClientHasActiveLocationException(Long clientId) {
        super("Client with id " + clientId + " has active location(s) and cannot be deleted.");
    }
}
