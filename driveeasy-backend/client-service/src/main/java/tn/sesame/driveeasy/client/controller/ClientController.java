package tn.sesame.driveeasy.client.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tn.sesame.driveeasy.client.dto.*;
import tn.sesame.driveeasy.client.service.ClientService;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/clients")
public class ClientController {

    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ClientResponseDto>> searchClients(
            @RequestParam(name = "q", required = false) String query) {
        return ResponseEntity.ok(service.searchClients(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponseDto> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getClientById(id));
    }

    @PostMapping
    public ResponseEntity<ClientResponseDto> createClient(@Valid @RequestBody ClientRequestDto dto) {
        ClientResponseDto created = service.createClient(dto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponseDto> updateClient(@PathVariable Long id,
                                                          @Valid @RequestBody ClientRequestDto dto) {
        return ResponseEntity.ok(service.updateClient(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        service.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/eligibilite")
    public ResponseEntity<EligibiliteResponseDto> checkEligibilite(@PathVariable Long id) {
        return ResponseEntity.ok(service.checkEligibilite(id));
    }

    @PatchMapping("/{id}/categorie")
    public ResponseEntity<ClientResponseDto> updateCategorie(@PathVariable Long id,
                                                            @Valid @RequestBody CategorieUpdateDto dto) {
        return ResponseEntity.ok(service.updateCategorie(id, dto));
    }
}
