package tn.sesame.driveeasy.client;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tn.sesame.driveeasy.client.model.Client;
import tn.sesame.driveeasy.client.enums.CategorieClient;
import tn.sesame.driveeasy.client.repository.ClientRepository;
import java.time.LocalDate;

@Configuration
public class ClientDataLoader {

    @Bean
    public CommandLineRunner loadSampleData(ClientRepository repository) {
        return args -> {
            // 5 realistic clients
            repository.save(create("AA123456", "Dupont", "Jean", LocalDate.of(1990,5,12), "jean.dupont@example.com", "0601020304", "1 rue Paris", "PERM001", LocalDate.of(2028,12,31), CategorieClient.STANDARD));
            repository.save(create("BB987654", "Martin", "Claire", LocalDate.of(1985,3,22), "claire.martin@example.com", "0602030405", "2 avenue Lyon", "PERM002", LocalDate.of(2027,6,30), CategorieClient.FIDELE));
            repository.save(create("CC555555", "Legrand", "Sophie", LocalDate.of(1995,9,5), "sophie.legrand@example.com", "0603040506", "3 boulevard Nice", "PERM003", LocalDate.of(2029,1,15), CategorieClient.VIP));
            repository.save(create("DD111111", "Moreau", "Paul", LocalDate.of(1992,12,1), "paul.moreau@example.com", "0604050607", "4 place Marseille", "PERM004", LocalDate.of(2026,11,30), CategorieClient.STANDARD));
            repository.save(create("EE222222", "Roux", "Laura", LocalDate.of(1998,7,19), "laura.roux@example.com", "0605060708", "5 chemin Bordeaux", "PERM005", LocalDate.of(2028,4,20), CategorieClient.STANDARD));
        };
    }

    private Client create(String cin, String nom, String prenom, LocalDate naissance, String email, String tel, String adresse, String numPermis, LocalDate expPermis, CategorieClient cat) {
        Client c = new Client();
        c.setCin(cin);
        c.setNom(nom);
        c.setPrenom(prenom);
        c.setDateNaissance(naissance);
        c.setEmail(email);
        c.setTelephone(tel);
        c.setAdresse(adresse);
        c.setNumeroPermis(numPermis);
        c.setDateExpirationPermis(expPermis);
        c.setCategorieClient(cat);
        c.setDateInscription(LocalDate.now());
        return c;
    }
}
