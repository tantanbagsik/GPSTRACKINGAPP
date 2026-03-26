#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <random>
#include <fstream>
#include <mutex>
#include <atomic>
#include <sqlite3.h>

using namespace std;

// GPS Coordinate structure
struct GPSCoordinate {
    double latitude;
    double longitude;
    double speed;
    double heading;
    long long timestamp;
    int vehicle_id;
};

// Vehicle tracking data
struct Vehicle {
    int id;
    string license_plate;
    string driver;
    bool gps_active;
    GPSCoordinate current_position;
    vector<GPSCoordinate> tracking_history;
};

// GPS Tracker Class
class GPSTracker {
private:
    sqlite3* db;
    vector<Vehicle> vehicles;
    mutex tracker_mutex;
    atomic<bool> tracking_active{false};
    
    // Simulate GPS signal with realistic movement
    GPSCoordinate simulateGPSMovement(const GPSCoordinate& current, int vehicle_id) {
        static random_device rd;
        static mt19937 gen(rd());
        static uniform_real_distribution<> lat_delta(-0.0005, 0.0005);
        static uniform_real_distribution<> lon_delta(-0.0005, 0.0005);
        static uniform_real_distribution<> speed_delta(0, 20);
        static uniform_real_distribution<> heading_delta(0, 360);
        
        GPSCoordinate updated;
        updated.latitude = current.latitude + lat_delta(gen);
        updated.longitude = current.longitude + lon_delta(gen);
        updated.speed = speed_delta(gen);
        updated.heading = heading_delta(gen);
        updated.timestamp = chrono::duration_cast<chrono::milliseconds>(
            chrono::system_clock::now().time_since_epoch()
        ).count();
        updated.vehicle_id = vehicle_id;
        
        return updated;
    }
    
    // Save tracking data to database
    void saveTrackingData(const GPSCoordinate& gps) {
        const string sql = "INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, heading, timestamp) "
                          "VALUES (?, ?, ?, ?, ?, ?);";
        
        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
            sqlite3_bind_int(stmt, 1, gps.vehicle_id);
            sqlite3_bind_double(stmt, 2, gps.latitude);
            sqlite3_bind_double(stmt, 3, gps.longitude);
            sqlite3_bind_double(stmt, 4, gps.speed);
            sqlite3_bind_double(stmt, 5, gps.heading);
            sqlite3_bind_longlong(stmt, 6, gps.timestamp);
            sqlite3_step(stmt);
            sqlite3_finalize(stmt);
        }
    }
    
    // Export tracking data to JSON for frontend
    void exportToJSON(const string& filename) {
        ofstream json_file(filename);
        json_file << "{\n  \"vehicles\": [\n";
        
        lock_guard<mutex> lock(tracker_mutex);
        for (size_t i = 0; i < vehicles.size(); ++i) {
            const auto& v = vehicles[i];
            json_file << "    {\n";
            json_file << "      \"id\": " << v.id << ",\n";
            json_file << "      \"license_plate\": \"" << v.license_plate << "\",\n";
            json_file << "      \"driver\": \"" << v.driver << "\",\n";
            json_file << "      \"gps_active\": " << (v.gps_active ? "true" : "false") << ",\n";
            json_file << "      \"latitude\": " << v.current_position.latitude << ",\n";
            json_file << "      \"longitude\": " << v.current_position.longitude << ",\n";
            json_file << "      \"speed\": " << v.current_position.speed << ",\n";
            json_file << "      \"heading\": " << v.current_position.heading << ",\n";
            json_file << "      \"timestamp\": " << v.current_position.timestamp << "\n";
            json_file << "    }" << (i < vehicles.size() - 1 ? "," : "") << "\n";
        }
        
        json_file << "  ]\n}\n";
        json_file.close();
    }

public:
    GPSTracker(const string& db_path = "tracking_data.db") {
        if (sqlite3_open(db_path.c_str(), &db) != SQLITE_OK) {
            cerr << "Database error: " << sqlite3_errmsg(db) << endl;
            return;
        }
        
        // Create GPS tracking table
        const char* create_sql = 
            "CREATE TABLE IF NOT EXISTS gps_tracking ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "vehicle_id INTEGER NOT NULL,"
            "latitude REAL NOT NULL,"
            "longitude REAL NOT NULL,"
            "speed REAL,"
            "heading REAL,"
            "timestamp INTEGER,"
            "FOREIGN KEY(vehicle_id) REFERENCES vehicles(id));";
        
        char* err_msg = nullptr;
        sqlite3_exec(db, create_sql, nullptr, nullptr, &err_msg);
        
        // Load vehicles from database
        loadVehicles();
    }
    
    void loadVehicles() {
        const char* sql = "SELECT id, license_plate, driver FROM vehicles WHERE gps_enabled = 1;";
        sqlite3_stmt* stmt;
        
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                Vehicle v;
                v.id = sqlite3_column_int(stmt, 0);
                v.license_plate = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
                v.driver = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
                v.gps_active = false;
                v.current_position = {14.5995, 120.9842, 0, 0, 0, v.id}; // Default: Manila
                vehicles.push_back(v);
            }
            sqlite3_finalize(stmt);
        }
    }
    
    void activateGPS(int vehicle_id) {
        lock_guard<mutex> lock(tracker_mutex);
        for (auto& v : vehicles) {
            if (v.id == vehicle_id) {
                v.gps_active = true;
                cout << "[GPS] Activated for vehicle " << v.license_plate << endl;
                
                // Update database
                const string update_sql = "UPDATE vehicles SET gps_enabled = 1, last_updated = CURRENT_TIMESTAMP WHERE id = ?;";
                sqlite3_stmt* stmt;
                if (sqlite3_prepare_v2(db, update_sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
                    sqlite3_bind_int(stmt, 1, vehicle_id);
                    sqlite3_step(stmt);
                    sqlite3_finalize(stmt);
                }
                break;
            }
        }
    }
    
    void deactivateGPS(int vehicle_id) {
        lock_guard<mutex> lock(tracker_mutex);
        for (auto& v : vehicles) {
            if (v.id == vehicle_id) {
                v.gps_active = false;
                cout << "[GPS] Deactivated for vehicle " << v.license_plate << endl;
                
                const string update_sql = "UPDATE vehicles SET gps_enabled = 0, last_updated = CURRENT_TIMESTAMP WHERE id = ?;";
                sqlite3_stmt* stmt;
                if (sqlite3_prepare_v2(db, update_sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
                    sqlite3_bind_int(stmt, 1, vehicle_id);
                    sqlite3_step(stmt);
                    sqlite3_finalize(stmt);
                }
                break;
            }
        }
    }
    
    void startLiveTracking(int update_interval_ms = 5000) {
        tracking_active = true;
        cout << "[GPS] Live tracking started (interval: " << update_interval_ms << "ms)" << endl;
        
        while (tracking_active) {
            lock_guard<mutex> lock(tracker_mutex);
            
            for (auto& v : vehicles) {
                if (v.gps_active) {
                    v.current_position = simulateGPSMovement(v.current_position, v.id);
                    v.tracking_history.push_back(v.current_position);
                    
                    // Keep only last 100 points
                    if (v.tracking_history.size() > 100) {
                        v.tracking_history.erase(v.tracking_history.begin());
                    }
                    
                    saveTrackingData(v.current_position);
                    
                    cout << "[GPS] Vehicle " << v.license_plate 
                         << " | Lat: " << v.current_position.latitude 
                         << " | Lon: " << v.current_position.longitude
                         << " | Speed: " << v.current_position.speed << " km/h" << endl;
                }
            }
            
            exportToJSON("gps_data.json");
            this_thread::sleep_for(chrono::milliseconds(update_interval_ms));
        }
    }
    
    void stopLiveTracking() {
        tracking_active = false;
        cout << "[GPS] Live tracking stopped" << endl;
    }
    
    vector<Vehicle> getActiveVehicles() {
        lock_guard<mutex> lock(tracker_mutex);
        vector<Vehicle> active;
        for (const auto& v : vehicles) {
            if (v.gps_active) {
                active.push_back(v);
            }
        }
        return active;
    }
    
    ~GPSTracker() {
        if (db) sqlite3_close(db);
    }
};

// Main function - GPS Tracking Service
int main() {
    cout << "========================================" << endl;
    cout << "  RP Motor Tracking - GPS Service" << endl;
    cout << "========================================" << endl;
    
    GPSTracker tracker("tracking_data.db");
    
    // Activate GPS for demo vehicles
    tracker.activateGPS(1);
    tracker.activateGPS(2);
    tracker.activateGPS(5);
    
    // Start live tracking (updates every 5 seconds)
    tracker.startLiveTracking(5000);
    
    return 0;
}
