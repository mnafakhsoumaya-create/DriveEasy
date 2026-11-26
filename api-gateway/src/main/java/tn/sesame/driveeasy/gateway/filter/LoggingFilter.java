package tn.sesame.driveeasy.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {
    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long start = System.currentTimeMillis();
        return chain.filter(exchange).doOnSuccess(v -> {
            long duration = System.currentTimeMillis() - start;
            logger.info("[Gateway] {} {} completed in {} ms",
                    exchange.getRequest().getMethod(),
                    exchange.getRequest().getURI().getPath(), duration);
        });
    }

    @Override
    public int getOrder() {
        // Run early so logging captures the whole request
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
