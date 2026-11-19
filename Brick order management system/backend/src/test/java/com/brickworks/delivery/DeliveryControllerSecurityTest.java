package com.brickworks.delivery;

import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.brickworks.security.SecurityConfig;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DeliveryController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class DeliveryControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;
    @MockBean
    private DeliveryService service;
    @MockBean
    private DataSource dataSource;

    @Test
    void rejectsAnonymousStatusUpdates() throws Exception {
        mockMvc.perform(patch("/api/v1/deliveries/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOADING\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsAuthenticatedNonAdminStatusUpdates() throws Exception {
        mockMvc.perform(patch("/api/v1/deliveries/1/status")
                        .with(user("operator").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOADING\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void allowsAdminStatusUpdates() throws Exception {
        mockMvc.perform(patch("/api/v1/deliveries/1/status")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOADING\"}"))
                .andExpect(status().isOk());

        verify(service).updateStatus(1L, DeliveryStatus.LOADING);
    }
}
