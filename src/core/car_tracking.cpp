#include <iostream>
#include <string>
#include <sqlite3.h>
#include <chrono>
#include <stdexcept>
#include <sstream>

using namespace std;

class CarTrackingApp {
private:
    sqlite3* db; // Database handle
    string db_path;
    
    // Initialize database connection
    [[nodiscard]] bool initializeDatabase() {
        const int rc = sqlite3_open(db_path.c_str(), &db);
        if (rc != SQLITE_OK) {
            throw runtime_error(sqlite3_errmsg(db));
        }
        
        const char* sql = "PRAGMA foreign_keys = ON;"
            "CREATE TABLE IF NOT EXISTS users ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "username TEXT UNIQUE NOT NULL,"
            "password TEXT NOT NULL,"
            "is_admin BOOLEAN NOT NULL DEFAULT 0);"
            "CREATE TABLE IF NOT EXISTS vehicles ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "user_id INTEGER NOT NULL,"
            "license_plate TEXT UNIQUE NOT NULL,"
            "location TEXT,"
            "last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);";

        char* errMsg = nullptr;
        const int execRc = sqlite3_exec(db, sql, nullptr, nullptr, &errMsg);
        if (execRc != SQLITE_OK) {
            const string err(errMsg);
            sqlite3_free(errMsg);
            throw runtime_error(err);
        }
        return true;
    }
    
public:
    CarTrackingApp(const string& path = "tracking_data.db")
        : db(nullptr), db_path(path) {
        initializeDatabase();
    }
    
    // Account creation
    [[nodiscard]] bool createUser(const string& username, const string& password, bool isAdmin = false) {
        if (username.empty() || password.empty()) {
            cerr << "Invalid credentials\n";
            return false;
        }
        
        const string sql = "INSERT INTO users (username, password, is_admin) VALUES ('" +
            username + "', '" + password + "', " + to_string(isAdmin) + ");";
        
        char* errMsg = nullptr;
        if (sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg) != SQLITE_OK) {
            const string err(errMsg);
            sqlite3_free(errMsg);
            throw runtime_error(err);
        }
        cout << "Account created for " + username + " (Admin: " + (isAdmin ? "Yes" : "No") + ")\n";
        return true;
    }

    // Authentication
    [[nodiscard]] bool validateUser(const string& username, const string& password) const {
        const string sql = "SELECT id FROM users WHERE username = '" + username + "' AND password = '" + password + "';";

        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW && sqlite3_column_int(stmt, 0)) {
                const int userId = sqlite3_column_int(stmt, 0);
                cout << "User " + username + " authenticated (ID: " + to_string(userId) + ")\n";
                sqlite3_finalize(stmt);
                return true;
            }
            sqlite3_finalize(stmt);
        }
        return false;
    }

    // Admin panel
    void adminPanel(const string& username) const {
        if (validateUser(username, "admin_pass_2023")) {
            cout << "\n\n===== ADMIN PANEL ACCESS GRANTED =====\n";
            cout << "Welcome Administrator: " + username + "\n\n";
        } else {
            cout << "\n\n===== ADMIN ACCESS DENIED =====\n";
            cout << "Insufficient privileges\n\n";
        }
    }

    ~CarTrackingApp() {
        if (db) sqlite3_close(db);
    }
};

int main() {
    CarTrackingApp app("grab_tracker.db");
    
    try {
        const bool adminCreated = app.createUser("admin_grab", "admin_pass_2023", true);
        const bool userCreated = app.createUser("driver_jojo", "driver_pass", false);
        
        if (adminCreated && userCreated) {
            cout << "\n=== DATABASE READY FOR TRAFFIC MONITORING\n\n";
            app.adminPanel("admin_grab");
            
            const bool loginSuccess = app.validateUser("driver_jojo", "driver_pass");
            cout << (loginSuccess ? "Login: SUCCESS\n" : "Login: FAILED\n");
        }
    } catch (const exception& e) {
        cerr << "\nFatal error: " + string(e.what()) + "\n";
        return EXIT_FAILURE;
    }
    
    return EXIT_SUCCESS;
}