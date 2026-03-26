#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <random>
#include <cmath>
#include <fstream>
#include <mutex>
#include <atomic>
#include <sstream>
#include <iomanip>

using namespace std;

// GPS Coordinate structure
struct GPSCoordinate {
    double latitude;
    double longitude;
    double speed;
    double heading;
    double altitude;
    long long timestamp;
    int vehicle_id;
};

// Vehicle tracking data
struct Vehicle {
    int id;
    string license_plate;
    string driver;
    string type;
    bool gps_active;
    GPSCoordinate current_position;
    vector<GPSCoordinate> tracking_history;
    double battery;
    string signal_strength;
};

// Road pattern for realistic movement
struct RoadPattern {
    double start_lat;
    double start_lon;
    double end_lat;
    double end_lon;
    double speed_limit;
};

// GPS Tracker Class
class GPSTracker {
private:
    vector<Vehicle> vehicles;
    mutex tracker_mutex;
    atomic<bool> tracking_active{false};
    vector<RoadPattern> roads;
    
    // Initialize road patterns (Philippines roads)
    void initRoadPatterns() {
        roads = {
            {14.5995, 120.9842, 14.6100, 120.9900, 60.0},  // EDSA
            {14.5547, 121.0244, 14.5600, 121.0300, 80.0},  // C5
            {14.5800, 120.9700, 14.5900, 120.9750, 40.0},  // Taft Ave
            {14.6000, 120.9800, 14.6200, 121.0000, 100.0}, // NLEX
            {14.5200, 121.0000, 14.5400, 121.0200, 60.0},  // SLEX
        };
    }
    
    // Get random road pattern
    RoadPattern getRandomRoad() {
        static random_device rd;
        static mt19937 gen(rd());
        uniform_int_distribution<> dis(0, roads.size() - 1);
        return roads[dis(gen)];
    }
    
    // Simulate realistic GPS movement along roads
    GPSCoordinate simulateGPSMovement(const GPSCoordinate& current, int vehicle_id) {
        static random_device rd;
        static mt19937 gen(rd());
        static uniform_real_distribution<> noise(-0.0001, 0.0001);
        static uniform_real_distribution<> speed_variation(-5.0, 5.0);
        
        RoadPattern road = getRandomRoad();
        
        GPSCoordinate updated;
        double progress = (current.latitude - road.start_lat) / (road.end_lat - road.start_lat);
        if (progress < 0 || progress > 1) progress = 0.5;
        
        // Interpolate along road
        updated.latitude = road.start_lat + (road.end_lat - road.start_lat) * progress + noise(gen);
        updated.longitude = road.start_lon + (road.end_lon - road.start_lon) * progress + noise(gen);
        
        // Speed based on road limit with variation
        updated.speed = road.speed_limit + speed_variation(gen);
        updated.speed = max(0.0, updated.speed);
        
        // Calculate heading from coordinates
        updated.heading = atan2(road.end_lon - road.start_lon, road.end_lat - road.start_lat) * 180.0 / M_PI;
        if (updated.heading < 0) updated.heading += 360.0;
        
        updated.altitude = 10.0 + noise(gen) * 100;
        updated.timestamp = chrono::duration_cast<chrono::milliseconds>(
            chrono::system_clock::now().time_since_epoch()
        ).count();
        updated.vehicle_id = vehicle_id;
        
        return updated;
    }
    
    // Export tracking data to JSON
    void exportToJSON(const string& filename) {
        ofstream json_file(filename);
        json_file << "{\n  \"timestamp\": " << chrono::duration_cast<chrono::milliseconds>(
            chrono::system_clock::now().time_since_epoch()
        ).count() << ",\n  \"vehicles\": [\n";
        
        lock_guard<mutex> lock(tracker_mutex);
        for (size_t i = 0; i < vehicles.size(); ++i) {
            const auto& v = vehicles[i];
            if (!v.gps_active) continue;
            
            json_file << "    {\n";
            json_file << "      \"id\": " << v.id << ",\n";
            json_file << "      \"license_plate\": \"" << v.license_plate << "\",\n";
            json_file << "      \"driver\": \"" << v.driver << "\",\n";
            json_file << "      \"type\": \"" << v.type << "\",\n";
            json_file << "      \"gps_active\": " << (v.gps_active ? "true" : "false") << ",\n";
            json_file << "      \"latitude\": " << fixed << setprecision(6) << v.current_position.latitude << ",\n";
            json_file << "      \"longitude\": " << fixed << setprecision(6) << v.current_position.longitude << ",\n";
            json_file << "      \"speed\": " << fixed << setprecision(1) << v.current_position.speed << ",\n";
            json_file << "      \"heading\": " << fixed << setprecision(1) << v.current_position.heading << ",\n";
            json_file << "      \"altitude\": " << fixed << setprecision(1) << v.current_position.altitude << ",\n";
            json_file << "      \"battery\": " << fixed << setprecision(0) << v.battery << ",\n";
            json_file << "      \"signal\": \"" << v.signal_strength << "\",\n";
            json_file << "      \"timestamp\": " << v.current_position.timestamp << "\n";
            json_file << "    }" << (i < vehicles.size() - 1 ? "," : "") << "\n";
        }
        
        json_file << "  ]\n}\n";
        json_file.close();
    }

public:
    GPSTracker() {
        initRoadPatterns();
    }
    
    void addVehicle(int id, const string& plate, const string& driver, const string& type) {
        lock_guard<mutex> lock(tracker_mutex);
        Vehicle v;
        v.id = id;
        v.license_plate = plate;
        v.driver = driver;
        v.type = type;
        v.gps_active = false;
        v.battery = 80.0 + (rand() % 20);
        v.signal_strength = "Strong";
        v.current_position = {14.5995, 120.9842, 0, 0, 10, 0, id};
        vehicles.push_back(v);
    }
    
    void activateGPS(int vehicle_id) {
        lock_guard<mutex> lock(tracker_mutex);
        for (auto& v : vehicles) {
            if (v.id == vehicle_id) {
                v.gps_active = true;
                cout << "[GPS] Activated for vehicle " << v.license_plate << endl;
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
                break;
            }
        }
    }
    
    void startLiveTracking(int update_interval_ms = 2000) {
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
                    
                    // Update battery
                    v.battery -= 0.01;
                    if (v.battery < 0) v.battery = 100;
                    
                    cout << "[GPS] " << v.license_plate 
                         << " | Lat: " << fixed << setprecision(6) << v.current_position.latitude 
                         << " | Lon: " << fixed << setprecision(6) << v.current_position.longitude
                         << " | Speed: " << fixed << setprecision(1) << v.current_position.speed << " km/h"
                         << " | Battery: " << fixed << setprecision(0) << v.battery << "%" << endl;
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
};

// Main function
int main() {
    cout << "========================================" << endl;
    cout << "  GPS Live Tracking System v2.0" << endl;
    cout << "========================================" << endl;
    
    GPSTracker tracker;
    
    // Add vehicles
    tracker.addVehicle(1, "ABC-1234", "John Doe", "car");
    tracker.addVehicle(2, "XYZ-5678", "Jane Smith", "truck");
    tracker.addVehicle(3, "DEF-9012", "Mike Johnson", "motorcycle");
    tracker.addVehicle(4, "GHI-3456", "Sarah Lee", "van");
    tracker.addVehicle(5, "JKL-7890", "Tom Brown", "car");
    
    // Activate GPS for some vehicles
    tracker.activateGPS(1);
    tracker.activateGPS(2);
    tracker.activateGPS(4);
    
    // Start live tracking (updates every 2 seconds)
    tracker.startLiveTracking(2000);
    
    return 0;
}
