package com.fabrizio.sistema_reservas.config;

import com.fabrizio.sistema_reservas.model.Cine;
import com.fabrizio.sistema_reservas.model.Rol;
import com.fabrizio.sistema_reservas.model.Sala;
import com.fabrizio.sistema_reservas.model.Ubicacion;
import com.fabrizio.sistema_reservas.model.Usuario;
import com.fabrizio.sistema_reservas.repository.CineRepository;
import com.fabrizio.sistema_reservas.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(CineRepository cineRepository, UsuarioRepository usuarioRepository) {
        return args -> {
            // Seeder de Cines
            if (cineRepository.count() == 0) {
                Cine cine = new Cine("Cine Hoyts", new Ubicacion("Argentina", "Av. San Martín 123, San Justo"));
                Sala sala1 = new Sala(1, 150);
                Sala sala2 = new Sala(2, 200);
                cine.agregarSala(sala1);
                cine.agregarSala(sala2);
                cineRepository.save(cine);
            }

            // Seeder de Usuarios (Tu Admin de prueba)
            if (usuarioRepository.count() == 0) {
                Usuario admin = new Usuario("Fabrizio (Admin)", "admin@reservas.com", "admin123", Rol.ADMIN);
                Usuario cliente = new Usuario("Cliente Prueba", "cliente@reservas.com", "cliente123", Rol.USER);
                
                usuarioRepository.save(admin);
                usuarioRepository.save(cliente);
                System.out.println("✅ Usuarios de prueba (Admin y Cliente) cargados en Neon");
            }
        };
    }
}