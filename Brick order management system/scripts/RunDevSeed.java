import java.io.Console;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.flywaydb.core.Flyway;

public class RunDevSeed {
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("Pass the path to dev-seed.sql.");
        }
        Console console = System.console();
        if (console == null) {
            throw new IllegalStateException("Run this command in an interactive terminal.");
        }

        char[] password = console.readPassword("PostgreSQL password for brickerp user postgres: ");
        String databaseUrl = System.getenv().getOrDefault("DATABASE_URL", "jdbc:postgresql://localhost:5432/brickerp");
        String username = System.getenv().getOrDefault("PGUSER", "postgres");
        try {
            Flyway.configure()
                    .dataSource(databaseUrl, username, new String(password))
                    .locations("classpath:db/migration")
                    .load()
                    .migrate();
            try (Connection connection = DriverManager.getConnection(databaseUrl, username, new String(password))) {
                Set<String> requiredTables = Set.of(
                        "customers", "products", "inventory", "orders", "order_items",
                        "production_entries", "vehicles", "deliveries", "delivery_items", "payments");
                Set<String> foundTables = new HashSet<>();
                try (ResultSet tables = connection.getMetaData().getTables(connection.getCatalog(), "public", "%", new String[] {"TABLE"})) {
                    while (tables.next()) {
                        foundTables.add(tables.getString("TABLE_NAME"));
                    }
                }
                if (!foundTables.containsAll(requiredTables)) {
                    Set<String> missing = new HashSet<>(requiredTables);
                    missing.removeAll(foundTables);
                    throw new IllegalStateException("Expected project tables are missing: " + missing + ". No seed data was written.");
                }

                String sql = Files.readString(Path.of(args[0]));
                int statementsRun = 0;
                connection.setAutoCommit(false);
                try (Statement statement = connection.createStatement()) {
                    for (String fragment : sql.split(";")) {
                        String command = fragment.trim();
                        if (!command.isEmpty() && !command.equalsIgnoreCase("BEGIN") && !command.equalsIgnoreCase("COMMIT")) {
                            statement.execute(command);
                            statementsRun++;
                        }
                    }
                    connection.commit();
                } catch (Exception exception) {
                    connection.rollback();
                    throw exception;
                }
                System.out.println("Seed complete in database " + connection.getCatalog() + "; SQL statements executed: " + statementsRun);
                try (Statement statement = connection.createStatement();
                     ResultSet counts = statement.executeQuery("SELECT (SELECT count(*) FROM customers WHERE customer_code LIKE 'TEST-CUST-%') AS test_customers, (SELECT count(*) FROM products WHERE product_code LIKE 'TEST-%') AS test_products, (SELECT count(*) FROM orders WHERE order_number LIKE 'TEST-ORD-%') AS test_orders, (SELECT count(*) FROM payments WHERE reference_number LIKE 'TEST-PAY-%') AS test_payments")) {
                    if (counts.next()) {
                        System.out.printf("Verified test rows: customers=%d, products=%d, orders=%d, payments=%d%n",
                                counts.getLong("test_customers"), counts.getLong("test_products"),
                                counts.getLong("test_orders"), counts.getLong("test_payments"));
                    }
                }
            }
        } finally {
            Arrays.fill(password, '\0');
        }
    }
}
