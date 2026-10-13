package com.fabrizio.sistema_reservas.repository;

import com.fabrizio.sistema_reservas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Integer> {
    List<Reserva> findByIdFuncion(int idFuncion);
}