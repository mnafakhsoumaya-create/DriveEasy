package tn.sesame.driveeasy.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Filtre personnalisé global pour l'API Gateway DriveEasy.
 * Assure :
 * 1. La génération / propagation d'un Correlation ID (X-Correlation-Id) pour le traçage distribué
 * 2. Le calcul précis du temps de réponse (X-Response-Time-Millis)
 * 3. La journalisation détaillée des requêtes et réponses HTTP
 */
@Component
public class LoggingAndTrackingGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(LoggingAndTrackingGlobalFilter.class);
    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String RESPONSE_TIME_HEADER = "X-Response-Time-Millis";
    private static final String START_TIME_ATTR = "startTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        exchange.getAttributes().put(START_TIME_ATTR, startTime);

        // Récupérer ou générer le Correlation-Id
        String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        // Propager le correlationId dans la requête transmise aux microservices
        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(exchange.getRequest().mutate()
                        .header(CORRELATION_ID_HEADER, correlationId)
                        .build())
                .build();

        String path = mutatedExchange.getRequest().getURI().getPath();
        String method = mutatedExchange.getRequest().getMethod().name();
        final String finalCorrelationId = correlationId;

        log.info("[GATEWAY-IN] [{}] {} {} - Client: {}",
                finalCorrelationId, method, path, mutatedExchange.getRequest().getRemoteAddress());

        // Response headers must be set before the body commits. Mutating them
        // after chain.filter() completes can terminate chunked responses early.
        exchange.getResponse().beforeCommit(() -> {
            Long start = exchange.getAttribute(START_TIME_ATTR);
            long duration = (start != null) ? (System.currentTimeMillis() - start) : 0;
            HttpHeaders headers = exchange.getResponse().getHeaders();
            headers.set(CORRELATION_ID_HEADER, finalCorrelationId);
            headers.set(RESPONSE_TIME_HEADER, duration + "ms");
            return Mono.empty();
        });

        return chain.filter(mutatedExchange).doFinally(signal -> {
            Long start = exchange.getAttribute(START_TIME_ATTR);
            long duration = (start != null) ? (System.currentTimeMillis() - start) : 0;
            int statusCode = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value() : 200;
            log.info("[GATEWAY-OUT] [{}] {} {} -> Status: {} (Durée: {} ms)",
                    finalCorrelationId, method, path, statusCode, duration);
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
