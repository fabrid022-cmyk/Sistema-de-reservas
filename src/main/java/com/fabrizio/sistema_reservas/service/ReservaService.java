package com.fabrizio.sistema_reservas.service;

import com.fabrizio.sistema_reservas.model.Estado;
import com.fabrizio.sistema_reservas.model.Reserva;
import com.fabrizio.sistema_reservas.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;

    @Transactional
    public Reserva crearReserva(Reserva reserva) {
        reserva.setEstado(Estado.PENDIENTE);
        reserva.setFechaHoraCreacion(LocalDateTime.now());
        return reservaRepository.save(reserva);
    }

    @Transactional
    public void confirmarReserva(Integer idReserva) {
        reservaRepository.findById(idReserva).ifPresent(reserva -> {
            reserva.setEstado(Estado.CONFIRMADA);
            reservaRepository.save(reserva);
        });
    }
}