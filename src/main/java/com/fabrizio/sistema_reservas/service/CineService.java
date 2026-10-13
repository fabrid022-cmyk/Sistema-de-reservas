package com.fabrizio.sistema_reservas.service;

import com.fabrizio.sistema_reservas.dto.CineDTO;
import com.fabrizio.sistema_reservas.dto.SalaDTO;
import com.fabrizio.sistema_reservas.model.Cine;
import com.fabrizio.sistema_reservas.model.Sala;
import com.fabrizio.sistema_reservas.repository.CineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CineService {

    @Autowired
    private CineRepository cineRepository;

    // Método principal que va a usar el Controller
    public List<CineDTO> obtenerTodosLosCines() {
        List<Cine> cines = cineRepository.findAll();
        
        // Convertimos la lista de entidades a lista de DTOs usando Streams de Java
        return cines.stream()
                .map(this::convertirACineDTO)
                .collect(Collectors.toList());
    }

    // Método privado auxiliar para mapear de Entidad a DTO
    private CineDTO convertirACineDTO(Cine cine) {
        CineDTO dto = new CineDTO();
        dto.setIdCine(cine.getIdCine());
        dto.setNombre(cine.getNombre());
        
        // Aplanamos la ubicación
        if (cine.getUbicacion() != null) {
            dto.setPais(cine.getUbicacion().getPais());
            dto.setDireccion(cine.getUbicacion().getDireccion());
        }

        // Mapeamos las salas a SalaDTO para evitar el bucle infinito
        if (cine.getSalas() != null) {
            List<SalaDTO> salasDTO = cine.getSalas().stream()
                    .map(this::convertirASalaDTO)
                    .collect(Collectors.toList());
            dto.setSalas(salasDTO);
        }

        return dto;
    }

    private SalaDTO convertirASalaDTO(Sala sala) {
        return new SalaDTO(sala.getIdSala(), sala.getNumero(), sala.getCapacidad());
    }
}