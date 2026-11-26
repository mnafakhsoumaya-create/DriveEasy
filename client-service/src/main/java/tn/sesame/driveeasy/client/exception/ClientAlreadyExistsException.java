package tn.sesame.driveeasy.client.exception;

public class ClientAlreadyExistsException extends RuntimeException {
    public ClientAlreadyExistsException(String field, String value) {
        super(String.format("%s already exists with value '%s'", field, value));
    }
}
