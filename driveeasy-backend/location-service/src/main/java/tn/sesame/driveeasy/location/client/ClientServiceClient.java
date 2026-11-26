package tn.sesame.driveeasy.location.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tn.sesame.driveeasy.location.dto.ClientRemoteDto;
import tn.sesame.driveeasy.location.dto.EligibiliteRemoteDto;
import tn.sesame.driveeasy.location.exception.InterServiceException;
import tn.sesame.driveeasy.location.exception.ResourceNotFoundException;

import java.util.Map;

@Component
public class ClientServiceClient {

    private static final Logger log = LoggerFactory.getLogger(ClientServiceClient.class);

    private final RestTemplate loadBalancedRestTemplate;
    private final RestTemplate directRestTemplate;

    @Autowired
    public ClientServiceClient(@Qualifier("loadBalancedRestTemplate") RestTemplate loadBalancedRestTemplate,
                               @Qualifier("directRestTemplate") RestTemplate directRestTemplate) {
        this.loadBalancedRestTemplate = loadBalancedRestTemplate;
        this.directRestTemplate = directRestTemplate;
    }

    public ClientRemoteDto getClient(Long id) {
        try {
            return loadBalancedRestTemplate.getForObject("http://client-service/clients/" + id, ClientRemoteDto.class);
        } catch (Exception e) {
            log.warn("LoadBalanced call to client-service failed, trying direct endpoint: {}", e.getMessage());
            try {
                return directRestTemplate.getForObject("http://localhost:8082/clients/" + id, ClientRemoteDto.class);
            } catch (Exception ex) {
                log.error("Failed to fetch client ID {}: {}", id, ex.getMessage());
                throw new ResourceNotFoundException("Impossible de récupérer le client ID " + id + " : " + ex.getMessage());
            }
        }
    }

    public EligibiliteRemoteDto checkEligibilite(Long id) {
        try {
            return loadBalancedRestTemplate.getForObject("http://client-service/clients/" + id + "/eligibilite", EligibiliteRemoteDto.class);
        } catch (Exception e) {
            log.warn("LoadBalanced call to client-service /eligibilite failed, trying direct endpoint: {}", e.getMessage());
            try {
                return directRestTemplate.getForObject("http://localhost:8082/clients/" + id + "/eligibilite", EligibiliteRemoteDto.class);
            } catch (Exception ex) {
                log.error("Failed to check eligibility for client ID {}: {}", id, ex.getMessage());
                throw new InterServiceException("Échec de la vérification d'éligibilité pour le client ID " + id + " : " + ex.getMessage());
            }
        }
    }

    public void updateCategorie(Long id, String categorie) {
        Map<String, String> body = Map.of("categorie", categorie);
        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(body);

        try {
            loadBalancedRestTemplate.exchange("http://client-service/clients/" + id + "/categorie",
                    HttpMethod.PATCH, requestEntity, Void.class);
        } catch (Exception e) {
            log.warn("LoadBalanced PATCH to client-service /categorie failed, trying direct endpoint: {}", e.getMessage());
            try {
                directRestTemplate.exchange("http://localhost:8082/clients/" + id + "/categorie",
                        HttpMethod.PATCH, requestEntity, Void.class);
            } catch (Exception ex) {
                log.error("Failed to update loyalty category for client ID {}: {}", id, ex.getMessage());
                // Non bloquant pour ne pas casser le retour de location si la mise à jour échoue
            }
        }
    }
}
