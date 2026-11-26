package tn.sesame.driveeasy.client.controller;

import tn.sesame.driveeasy.client.model.Client;
import tn.sesame.driveeasy.client.service.ClientService;
import tn.sesame.driveeasy.client.exception.ClientNotFoundException;
import tn.sesame.driveeasy.client.exception.ClientAlreadyExistsException;
import tn.sesame.driveeasy.client.enums.CategorieClient;
import tn.sesame.driveeasy.client.exception.ClientHasActiveLocationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/clients")
@Validated
public class ClientController {
    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @GetMapping
    public List<Client> getAll(@RequestParam Optional<String> nom,
                               @RequestParam Optional<String> cin,
                               @RequestParam Optional<String> email) {
        return service.getAll(nom, cin, email);
    }

    @GetMapping("/{id}")
    public Client getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<Client> create(@RequestBody Client client) {
        Client created = service.create(client);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public Client update(@PathVariable Long id, @RequestBody Client client) {
        return service.update(id, client);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        // location-service will validate active rental; we just forward delete
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/eligibilite")
    public ResponseEntity<Boolean> eligibility(@PathVariable Long id) {
        boolean ok = service.isEligible(id);
        return ResponseEntity.ok(ok);
    }

    @PatchMapping("/{id}/categorie")
    public ResponseEntity<Void> updateCategory(@PathVariable Long id,
                                                @RequestBody CategorieClient cat) {
        service.updateCategory(id, cat);
        return ResponseEntity.noContent().build();
    }
}
