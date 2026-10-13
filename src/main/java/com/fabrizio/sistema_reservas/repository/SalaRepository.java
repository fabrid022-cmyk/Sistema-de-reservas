package com.fabrizio.sistema_reservas.repository;
import com.fabrizio.sistema_reservas.model.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Integer> {}