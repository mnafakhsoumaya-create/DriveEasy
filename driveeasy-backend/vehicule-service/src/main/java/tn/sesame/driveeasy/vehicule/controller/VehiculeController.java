package tn.sesame.driveeasy.vehicule.controller;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tn.sesame.driveeasy.vehicule.dto.StatutUpdateDto;
import tn.sesame.driveeasy.vehicule.dto.VehiculeRequestDto;
import tn.sesame.driveeasy.vehicule.dto.VehiculeResponseDto;
import tn.sesame.driveeasy.vehicule.model.Carburant;
import tn.sesame.driveeasy.vehicule.model.CategorieVehicule;
import tn.sesame.driveeasy.vehicule.model.StatutVehicule;
import tn.sesame.driveeasy.vehicule.service.VehiculeService;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/vehicules")
public class VehiculeController {

    private final VehiculeService service;

    public VehiculeController(VehiculeService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<VehiculeResponseDto>> getAllVehicules(
            @RequestParam(required = false) CategorieVehicule categorie,
            @RequestParam(required = false) Carburant carburant,
            @RequestParam(required = false) StatutVehicule statut,
            @RequestParam(required = false) BigDecimal prixMax) {
        return ResponseEntity.ok(service.getAllVehicules(categorie, carburant, statut, prixMax));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehiculeResponseDto> getVehiculeById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getVehiculeById(id));
    }

    @PostMapping
    public ResponseEntity<VehiculeResponseDto> createVehicule(@Valid @RequestBody VehiculeRequestDto dto) {
        VehiculeResponseDto created = service.createVehicule(dto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehiculeResponseDto> updateVehicule(@PathVariable Long id,
                                                              @Valid @RequestBody VehiculeRequestDto dto) {
        return ResponseEntity.ok(service.updateVehicule(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicule(@PathVariable Long id) {
        service.deleteVehicule(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<VehiculeResponseDto> updateStatut(@PathVariable Long id,
                                                            @Valid @RequestBody StatutUpdateDto dto) {
        return ResponseEntity.ok(service.updateStatut(id, dto));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<VehiculeResponseDto>> getVehiculesDisponibles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(service.getVehiculesDisponiblesPourPeriode(dateDebut, dateFin));
    }
}
