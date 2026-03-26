cmake_minimum_required(VERSION 3.15)
project(CarTrackingApp)

# Define sources
set(SOURCES
    src/core/car_tracking.cpp
)

# SQLite3 headers and library
find_package(SQLite3 REQUIRED)
include_directories(${SQLITE3_INCLUDE_DIR})

# Compile and link
add_executable(${PROJECT_NAME} ${SOURCES})
target_link_libraries(${PROJECT_NAME} PRIVATE ${SQLITE3_LIBRARIES})
