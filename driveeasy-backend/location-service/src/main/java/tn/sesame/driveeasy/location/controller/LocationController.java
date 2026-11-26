package tn.sesame.driveeasy.location.controller;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tn.sesame.driveeasy.location.dto.*;
import tn.sesame.driveeasy.location.model.StatutLocation;
import tn.sesame.driveeasy.location.service.LocationService;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/locations")
public class LocationController {

    private final LocationService service;

    public LocationController(LocationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<LocationResponseDto>> getLocations(
            @RequestParam(required = false) StatutLocation statut,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long vehiculeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getLocations(statut, clientId, vehiculeId, dateDebut, dateFin, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationDetailDto> getLocationById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getLocationDetail(id));
    }

    @PostMapping
    public ResponseEntity<LocationResponseDto> createReservation(@Valid @RequestBody LocationRequestDto dto) {
        LocationResponseDto created = service.createReservation(dto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PostMapping("/simulation")
    public ResponseEntity<SimulationResponseDto> simulatePricing(@Valid @RequestBody SimulationRequestDto dto) {
        return ResponseEntity.ok(service.simulatePricing(dto));
    }

    @PatchMapping("/{id}/depart")
    public ResponseEntity<LocationResponseDto> startRental(@PathVariable Long id) {
        return ResponseEntity.ok(service.startRental(id));
    }

    @PatchMapping("/{id}/retour")
    public ResponseEntity<LocationResponseDto> returnRental(@PathVariable Long id,
                                                            @Valid @RequestBody RetourLocationDto dto) {
        return ResponseEntity.ok(service.returnRental(id, dto));
    }

    @PatchMapping("/{id}/annulation")
    public ResponseEntity<LocationResponseDto> cancelReservation(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancelReservation(id));
    }

    @GetMapping("/statistiques")
    public ResponseEntity<StatistiquesDto> getStatistiques() {
        return ResponseEntity.ok(service.getStatistiques());
    }

    @GetMapping("/client/{clientId}/active")
    public ResponseEntity<Map<String, Object>> hasActiveLocation(@PathVariable Long clientId) {
        boolean active = service.hasActiveLocationForClient(clientId);
        return ResponseEntity.ok(Map.of(
                "clientId", clientId,
                "hasActiveLocation", active
        ));
    }
}