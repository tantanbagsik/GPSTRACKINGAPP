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
#include <map>
#include <cctype>
#include <sstream>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

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
    string address;
};

// Road pattern for realistic movement
struct RoadPattern {
    double start_lat;
    double start_lon;
    double end_lat;
    double end_lon;
    double speed_limit;
    string name;
};

// Simple HTTP Server
class HTTPServer {
private:
    int port;
    atomic<bool> running{false};
    thread server_thread;

public:
    HTTPServer(int p) : port(p) {}

    void start() {
        running = true;
        server_thread = thread([this]() { runServer(); });
    }

    void stop() {
        running = false;
        if (server_thread.joinable()) {
            server_thread.join();
        }
    }

    void runServer() {
        string server = "GPS Tracking Server v1.0\n";
        cout << "[HTTP] Server started on port " << port << endl;
        
        while (running) {
            this_thread::sleep_for(chrono::milliseconds(100));
        }
    }
};

// GPS Tracker Class
class GPSTracker {
private:
    vector<Vehicle> vehicles;
    mutex tracker_mutex;
    atomic<bool> tracking_active{false};
    vector<RoadPattern> roads;
    thread tracking_thread;
    
    void initRoadPatterns() {
        roads = {
            {14.5995, 120.9842, 14.6500, 121.0500, 60.0, "EDSA - Quezon Avenue"},
            {14.5547, 121.0244, 14.5800, 121.0600, 80.0, "C5 - Taguig"},
            {14.5800, 120.9700, 14.5995, 120.9842, 40.0, "Taft Avenue"},
            {14.6000, 120.9800, 14.6500, 121.0000, 100.0, "NLEX"},
            {14.5200, 121.0000, 14.5600, 121.0400, 60.0, "SLEX"},
            {14.6500, 121.0700, 14.6800, 121.1000, 50.0, "North EDSA"},
            {14.4792, 121.0271, 14.5200, 121.0500, 45.0, "BGC - Taguig"},
            {14.5641, 121.0632, 14.5800, 121.0800, 55.0, "Ayala Avenue"},
        };
    }
    
    RoadPattern getRandomRoad() {
        static random_device rd;
        static mt19937 gen(rd());
        uniform_int_distribution<> dis(0, roads.size() - 1);
        return roads[dis(gen)];
    }
    
    string getAddressFromCoordinates(double lat, double lon) {
        static random_device rd;
        static mt19937 gen(rd());
        
        vector<string> areas = {
            "Makati City, Metro Manila",
            "Quezon City, Metro Manila",
            "Taguig City, Metro Manila",
            "Manila City, Metro Manila",
            "Pasay City, Metro Manila",
            "Caloocan City, Metro Manila",
            "EDSA, Quezon City",
            "Bonifacio Global City, Taguig",
            "Ayala Center, Makati",
            "SM Mall of Asia, Pasay",
            "North Avenue, Quezon City",
            "Gil Puyat Avenue, Makati",
            "Roxas Boulevard, Manila",
            "Circumferential Road 5 (C5)",
            "North Luzon Expressway (NLEX)",
            "South Luzon Expressway (SLEX)",
        };
        
        uniform_int_distribution<> dis(0, areas.size() - 1);
        return areas[dis(gen)];
    }
    
    GPSCoordinate simulateGPSMovement(const GPSCoordinate& current, int vehicle_id) {
        static random_device rd;
        static mt19937 gen(rd());
        static uniform_real_distribution<> noise(-0.0002, 0.0002);
        static uniform_real_distribution<> speed_variation(-8.0, 8.0);
        static uniform_real_distribution<> progress_gen(0.0, 1.0);
        
        RoadPattern road = getRandomRoad();
        
        GPSCoordinate updated;
        double progress = progress_gen(gen);
        
        updated.latitude = road.start_lat + (road.end_lat - road.start_lat) * progress + noise(gen);
        updated.longitude = road.start_lon + (road.end_lon - road.start_lon) * progress + noise(gen);
        
        updated.speed = road.speed_limit + speed_variation(gen);
        updated.speed = max(0.0, min(120.0, updated.speed));
        
        updated.heading = atan2(road.end_lon - road.start_lon, road.end_lat - road.start_lat) * 180.0 / M_PI;
        if (updated.heading < 0) updated.heading += 360.0;
        
        updated.altitude = 10.0 + ((rd() % 200) - 100);
        updated.timestamp = chrono::duration_cast<chrono::milliseconds>(
            chrono::system_clock::now().time_since_epoch()
        ).count();
        updated.vehicle_id = vehicle_id;
        
        return updated;
    }
    
    void trackingLoop(int update_interval_ms) {
        while (tracking_active) {
            {
                lock_guard<mutex> lock(tracker_mutex);
                
                for (auto& v : vehicles) {
                    if (v.gps_active) {
                        v.current_position = simulateGPSMovement(v.current_position, v.id);
                        v.address = getAddressFromCoordinates(v.current_position.latitude, v.current_position.longitude);
                        v.tracking_history.push_back(v.current_position);
                        
                        if (v.tracking_history.size() > 100) {
                            v.tracking_history.erase(v.tracking_history.begin());
                        }
                        
                        v.battery -= 0.02;
                        if (v.battery < 10) v.battery = 100;
                        
                        static random_device rd;
                        static mt19937 gen(rd());
                        vector<string> signals = {"Strong", "Good", "Fair", "Weak"};
                        uniform_int_distribution<> dis(0, 3);
                        v.signal_strength = signals[dis(gen)];
                    }
                }
            }
            
            this_thread::sleep_for(chrono::milliseconds(update_interval_ms));
        }
    }

public:
    GPSTracker() {
        initRoadPatterns();
        initVehicles();
    }
    
    void initVehicles() {
        vehicles = {
            {1, "ABC-1234", "John Doe", "Toyota Vios", true, {14.5995, 120.9842, 0, 0, 10, 0, 1}, {}, 85, "Strong", "Makati City, Metro Manila"},
            {2, "XYZ-5678", "Jane Smith", "Honda Civic", true, {14.5547, 121.0244, 0, 0, 10, 0, 2}, {}, 72, "Good", "EDSA, Quezon City"},
            {3, "DEF-9012", "Mike Johnson", "Samsung Galaxy S24", false, {14.4792, 121.0271, 0, 0, 10, 0, 3}, {}, 45, "Fair", "BGC, Taguig"},
            {4, "GHI-3456", "Sarah Lee", "Toyota Fortuner", true, {14.6500, 121.0728, 0, 0, 10, 0, 4}, {}, 91, "Strong", "North EDSA, Quezon City"},
            {5, "JKL-7890", "Tom Brown", "iPhone 15 Pro", true, {14.5641, 121.0632, 0, 0, 10, 0, 5}, {}, 100, "Good", "Ayala Center, Makati"},
        };
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
        if (!tracking_active) {
            tracking_active = true;
            tracking_thread = thread([this, update_interval_ms]() { trackingLoop(update_interval_ms); });
            cout << "[GPS] Live tracking started (interval: " << update_interval_ms << "ms)" << endl;
        }
    }
    
    void stopLiveTracking() {
        if (tracking_active) {
            tracking_active = false;
            if (tracking_thread.joinable()) {
                tracking_thread.join();
            }
            cout << "[GPS] Live tracking stopped" << endl;
        }
    }
    
    string getGPSDataAsJSON() {
        lock_guard<mutex> lock(tracker_mutex);
        
        ostringstream json;
        json << "{\n";
        json << "  \"timestamp\": " << chrono::duration_cast<chrono::milliseconds>(
            chrono::system_clock::now().time_since_epoch()
        ).count() << ",\n";
        json << "  \"devices\": [\n";
        
        for (size_t i = 0; i < vehicles.size(); ++i) {
            const auto& v = vehicles[i];
            
            json << "    {\n";
            json << "      \"id\": " << v.id << ",\n";
            json << "      \"name\": \"" << v.type << " - " << v.license_plate << "\",\n";
            json << "      \"plate\": \"" << v.license_plate << "\",\n";
            json << "      \"driver\": \"" << v.driver << "\",\n";
            json << "      \"type\": \"" << (v.license_plate.find("ABC") != string::npos || v.license_plate.find("XYZ") != string::npos || v.license_plate.find("GHI") != string::npos || v.license_plate.find("JKL") != string::npos ? "vehicle" : "phone") << "\",\n";
            json << "      \"icon\": \"" << (v.license_plate.find("ABC") != string::npos || v.license_plate.find("XYZ") != string::npos || v.license_plate.find("GHI") != string::npos || v.license_plate.find("JKL") != string::npos ? "🚗" : "📱") << "\",\n";
            json << "      \"gpsOn\": " << (v.gps_active ? "true" : "false") << ",\n";
            json << "      \"battery\": " << fixed << setprecision(0) << v.battery << ",\n";
            json << "      \"signal\": " << (v.signal_strength == "Strong" ? 4 : v.signal_strength == "Good" ? 3 : v.signal_strength == "Fair" ? 2 : 1) << ",\n";
            json << "      \"lat\": " << fixed << setprecision(6) << v.current_position.latitude << ",\n";
            json << "      \"lng\": " << fixed << setprecision(6) << v.current_position.longitude << ",\n";
            json << "      \"speed\": " << fixed << setprecision(1) << v.current_position.speed << ",\n";
            json << "      \"address\": \"" << v.address << "\",\n";
            json << "      \"lastUpdated\": \"Just now\"\n";
            json << "    }" << (i < vehicles.size() - 1 ? "," : "") << "\n";
        }
        
        json << "  ]\n}\n";
        
        return json.str();
    }
    
    string toggleGPS(int device_id, bool enable) {
        if (enable) {
            activateGPS(device_id);
        } else {
            deactivateGPS(device_id);
        }
        
        ostringstream json;
        json << "{\n";
        json << "  \"success\": true,\n";
        json << "  \"deviceId\": " << device_id << ",\n";
        json << "  \"gpsOn\": " << (enable ? "true" : "false") << ",\n";
        json << "  \"message\": \"" << (enable ? "GPS enabled successfully" : "GPS disabled successfully") << "\"\n";
        json << "}\n";
        
        return json.str();
    }
    
    int getPort() { return 8080; }
};

// Global tracker instance
GPSTracker* g_tracker = nullptr;

string urlDecode(const string& str) {
    string result;
    for (size_t i = 0; i < str.length(); ++i) {
        if (str[i] == '%' && i + 2 < str.length()) {
            int value;
            istringstream iss(str.substr(i + 1, 2));
            if (iss >> hex >> value) {
                result += static_cast<char>(value);
                i += 2;
            }
        } else if (str[i] == '+') {
            result += ' ';
        } else {
            result += str[i];
        }
    }
    return result;
}

string handleRequest(const string& request) {
    size_t pos = request.find("\r\n\r\n");
    string body = pos != string::npos ? request.substr(pos + 4) : "";
    
    if (request.find("GET /api/gps/live") != string::npos) {
        string json = g_tracker->getGPSDataAsJSON();
        string response = "HTTP/1.1 200 OK\r\n";
        response += "Content-Type: application/json\r\n";
        response += "Access-Control-Allow-Origin: *\r\n";
        response += "Content-Length: " + to_string(json.length()) + "\r\n";
        response += "Connection: close\r\n";
        response += "\r\n";
        response += json;
        return response;
    }
    
    if (request.find("POST /api/gps/toggle") != string::npos) {
        int deviceId = 1;
        bool gpsOn = true;
        
        size_t idPos = body.find("deviceId=");
        if (idPos != string::npos) {
            size_t start = idPos + 9;
            size_t end = body.find("&", start);
            if (end == string::npos) end = body.length();
            deviceId = stoi(body.substr(start, end - start));
        }
        
        size_t onPos = body.find("gpsOn=");
        if (onPos != string::npos) {
            gpsOn = body.substr(onPos + 6) == "true";
        }
        
        string json = g_tracker->toggleGPS(deviceId, gpsOn);
        string response = "HTTP/1.1 200 OK\r\n";
        response += "Content-Type: application/json\r\n";
        response += "Access-Control-Allow-Origin: *\r\n";
        response += "Content-Length: " + to_string(json.length()) + "\r\n";
        response += "Connection: close\r\n";
        response += "\r\n";
        response += json;
        return response;
    }
    
    if (request.find("GET /") != string::npos) {
        string response = "HTTP/1.1 200 OK\r\n";
        response += "Content-Type: text/plain\r\n";
        response += "Access-Control-Allow-Origin: *\r\n";
        response += "Content-Length: 29\r\n";
        response += "Connection: close\r\n";
        response += "\r\n";
        response += "GPS Tracking Server v1.0";
        return response;
    }
    
    string response = "HTTP/1.1 404 Not Found\r\n";
    response += "Content-Type: text/plain\r\n";
    response += "Content-Length: 9\r\n";
    response += "Connection: close\r\n";
    response += "\r\n";
    response += "Not Found";
    return response;
}

void startServer() {
    const int PORT = 8080;
    
    cout << "========================================" << endl;
    cout << "  GPS Tracking HTTP Server v1.0" << endl;
    cout << "========================================" << endl;
    cout << "Server running on http://localhost:" << PORT << endl;
    cout << "API Endpoints:" << endl;
    cout << "  GET  /api/gps/live  - Get all device GPS data" << endl;
    cout << "  POST /api/gps/toggle - Toggle GPS on/off" << endl;
    cout << "========================================" << endl;
    
    g_tracker->startLiveTracking(2000);
    
    while (true) {
        this_thread::sleep_for(chrono::seconds(1));
    }
}

int main() {
    cout << "Starting GPS Tracking System..." << endl;
    
    g_tracker = new GPSTracker();
    
    startServer();
    
    return 0;
}