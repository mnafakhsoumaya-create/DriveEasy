package tn.sesame.driveeasy.location.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tn.sesame.driveeasy.location.dto.VehiculeRemoteDto;
import tn.sesame.driveeasy.location.exception.InterServiceException;
import tn.sesame.driveeasy.location.exception.ResourceNotFoundException;

import java.util.Map;
import java.util.List;
import java.util.Arrays;

@Component
public class VehiculeServiceClient {

    private static final Logger log = LoggerFactory.getLogger(VehiculeServiceClient.class);

    private final RestTemplate loadBalancedRestTemplate;
    private final RestTemplate directRestTemplate;

    @Autowired
    public VehiculeServiceClient(@Qualifier("loadBalancedRestTemplate") RestTemplate loadBalancedRestTemplate,
                                 @Qualifier("directRestTemplate") RestTemplate directRestTemplate) {
        this.loadBalancedRestTemplate = loadBalancedRestTemplate;
        this.directRestTemplate = directRestTemplate;
    }

    public VehiculeRemoteDto getVehicule(Long id) {
        try {
            return loadBalancedRestTemplate.getForObject("http://vehicule-service/vehicules/" + id, VehiculeRemoteDto.class);
        } catch (Exception e) {
            log.warn("LoadBalanced call to vehicule-service failed, trying direct endpoint: {}", e.getMessage());
            try {
                return directRestTemplate.getForObject("http://localhost:8081/vehicules/" + id, VehiculeRemoteDto.class);
            } catch (Exception ex) {
                log.error("Failed to fetch vehicle with id {}: {}", id, ex.getMessage());
                throw new ResourceNotFoundException("Impossible de récupérer le véhicule ID " + id + " : " + ex.getMessage());
            }
        }
    }

    public List<VehiculeRemoteDto> getVehicules() {
        try {
            VehiculeRemoteDto[] result = loadBalancedRestTemplate.getForObject(
                    "http://vehicule-service/vehicules", VehiculeRemoteDto[].class);
            return result == null ? List.of() : Arrays.asList(result);
        } catch (Exception e) {
            log.warn("LoadBalanced call to list vehicles failed, trying direct endpoint: {}", e.getMessage());
            try {
                VehiculeRemoteDto[] result = directRestTemplate.getForObject(
                        "http://localhost:8081/vehicules", VehiculeRemoteDto[].class);
                return result == null ? List.of() : Arrays.asList(result);
            } catch (Exception ex) {
                throw new InterServiceException("Impossible de récupérer le parc véhicules : " + ex.getMessage());
            }
        }
    }

    public void updateStatut(Long id, String statut) {
        Map<String, String> body = Map.of("statut", statut);
        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(body);

        try {
            loadBalancedRestTemplate.exchange("http://vehicule-service/vehicules/" + id + "/statut",
                    HttpMethod.PATCH, requestEntity, Void.class);
        } catch (Exception e) {
            log.warn("LoadBalanced PATCH to vehicule-service failed, trying direct endpoint: {}", e.getMessage());
            try {
                directRestTemplate.exchange("http://localhost:8081/vehicules/" + id + "/statut",
                        HttpMethod.PATCH, requestEntity, Void.class);
            } catch (Exception ex) {
                log.error("Failed to update status for vehicle ID {}: {}", id, ex.getMessage());
                throw new InterServiceException("Échec de la mise à jour du statut du véhicule ID " + id + " : " + ex.getMessage());
            }
        }
    }
}
