#!/bin/bash
# generate-test-data.sh
#
# This script generates realistic test data for the AI-driven Freight Optimization Platform.
# It populates the database with synthetic carriers, drivers, vehicles, loads, and location
# data to facilitate testing of the optimization algorithms, matching services, and other
# platform functionality.
#
# Dependencies:
# - jq: JSON processing in shell scripts
# - curl: Making HTTP requests to APIs
# - faker: Generating realistic fake data
# - postgresql-client: Connecting to PostgreSQL database

# Default values for global variables
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="freight_optimization"
DB_USER=""
DB_PASSWORD=""
API_URL=""
NUM_CARRIERS=50
NUM_DRIVERS=200
NUM_VEHICLES=250
NUM_SHIPPERS=100
NUM_LOADS=500
NUM_SMART_HUBS=30

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print usage information
print_usage() {
    echo "Usage: $(basename $0) [OPTIONS]"
    echo
    echo "Generates realistic test data for the AI-driven Freight Optimization Platform."
    echo
    echo "Options:"
    echo "  -h, --host HOST        Database host (default: localhost)"
    echo "  -p, --port PORT        Database port (default: 5432)"
    echo "  -d, --dbname NAME      Database name (default: freight_optimization)"
    echo "  -u, --user USER        Database username (required)"
    echo "  -w, --password PASS    Database password (required)"
    echo "  -a, --api-url URL      Base URL for the platform API (optional)"
    echo "  --carriers NUM         Number of carriers to generate (default: 50)"
    echo "  --drivers NUM          Number of drivers to generate (default: 200)"
    echo "  --vehicles NUM         Number of vehicles to generate (default: 250)"
    echo "  --shippers NUM         Number of shippers to generate (default: 100)"
    echo "  --loads NUM            Number of loads to generate (default: 500)"
    echo "  --smart-hubs NUM       Number of smart hubs to generate (default: 30)"
    echo "  --help                 Display this help message and exit"
    echo
    echo "Examples:"
    echo "  $(basename $0) -u dbuser -w dbpass"
    echo "  $(basename $0) -h dbhost -p 5433 -d freight_db -u dbuser -w dbpass --carriers 100 --drivers 500"
}

# Parse command line arguments and sets global variables
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--host)
                DB_HOST="$2"
                shift 2
                ;;
            -p|--port)
                DB_PORT="$2"
                shift 2
                ;;
            -d|--dbname)
                DB_NAME="$2"
                shift 2
                ;;
            -u|--user)
                DB_USER="$2"
                shift 2
                ;;
            -w|--password)
                DB_PASSWORD="$2"
                shift 2
                ;;
            -a|--api-url)
                API_URL="$2"
                shift 2
                ;;
            --carriers)
                NUM_CARRIERS="$2"
                shift 2
                ;;
            --drivers)
                NUM_DRIVERS="$2"
                shift 2
                ;;
            --vehicles)
                NUM_VEHICLES="$2"
                shift 2
                ;;
            --shippers)
                NUM_SHIPPERS="$2"
                shift 2
                ;;
            --loads)
                NUM_LOADS="$2"
                shift 2
                ;;
            --smart-hubs)
                NUM_SMART_HUBS="$2"
                shift 2
                ;;
            --help)
                print_usage
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option: $1${NC}" >&2
                print_usage
                return 1
                ;;
        esac
    done

    # Validate required parameters
    if [[ -z "$DB_USER" || -z "$DB_PASSWORD" ]]; then
        echo -e "${RED}Error: Database username and password are required.${NC}" >&2
        print_usage
        return 1
    fi

    return 0
}

# Checks if required dependencies are installed
check_dependencies() {
    local missing_deps=()

    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if ! command -v faker &> /dev/null; then
        missing_deps+=("faker (pip install faker)")
    fi

    if ! command -v psql &> /dev/null; then
        missing_deps+=("postgresql-client")
    fi

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo -e "${RED}Error: The following dependencies are missing:${NC}" >&2
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep" >&2
        done
        echo "Please install them and try again." >&2
        return 1
    fi

    return 0
}

# Generates synthetic carrier data
generate_carriers() {
    echo -e "${BLUE}Generating $NUM_CARRIERS carriers...${NC}"
    local counter=0
    local total=$NUM_CARRIERS
    
    # Create temp file for bulk insert
    local carrier_data_file=$(mktemp)
    
    # Generate the carrier data
    for ((i=1; i<=NUM_CARRIERS; i++)); do
        local company_name=$(faker company)
        local dot_number=$(printf "%07d" $((10000000 + RANDOM % 90000000)))
        local mc_number=$(printf "%06d" $((100000 + RANDOM % 900000)))
        local tax_id=$(printf "%09d" $((100000000 + RANDOM % 900000000)))
        
        # Generate address as JSON
        local street=$(faker street_address)
        local city=$(faker city)
        local state=$(faker state_abbr)
        local zip=$(faker zipcode)
        local address=$(jq -n \
            --arg street "$street" \
            --arg city "$city" \
            --arg state "$state" \
            --arg zip "$zip" \
            '{street: $street, city: $city, state: $state, zip: $zip}')
        
        # Generate contact info as JSON
        local contact_name=$(faker name)
        local phone=$(faker phone_number)
        local email=$(echo $company_name | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]')@example.com
        local contact_info=$(jq -n \
            --arg name "$contact_name" \
            --arg phone "$phone" \
            --arg email "$email" \
            '{name: $name, phone: $phone, email: $email}')
        
        # Format SQL for carrier
        echo "INSERT INTO carrier (name, dot_number, mc_number, tax_id, address, contact_info, created_at, updated_at, active) VALUES ('$company_name', '$dot_number', '$mc_number', '$tax_id', '$address', '$contact_info', NOW(), NOW(), true);" >> $carrier_data_file
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 10)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $carrier_data_file > /dev/null
    
    # Clean up
    rm $carrier_data_file
    
    echo -e "${GREEN}Successfully generated $NUM_CARRIERS carriers.${NC}"
    return 0
}

# Generates synthetic driver data
generate_drivers() {
    echo -e "${BLUE}Generating $NUM_DRIVERS drivers...${NC}"
    local counter=0
    local total=$NUM_DRIVERS
    
    # Get carrier IDs from the database
    local carrier_ids=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT carrier_id FROM carrier;" | tr -d ' ')
    local carrier_ids_array=($carrier_ids)
    local num_carriers=${#carrier_ids_array[@]}
    
    if [[ $num_carriers -eq 0 ]]; then
        echo -e "${RED}Error: No carriers found in database. Please generate carriers first.${NC}" >&2
        return 1
    fi
    
    # Create temp file for bulk insert
    local driver_data_file=$(mktemp)
    
    # Generate the driver data
    for ((i=1; i<=NUM_DRIVERS; i++)); do
        local first_name=$(faker first_name)
        local last_name=$(faker last_name)
        local email="${first_name}.${last_name}@example.com" | tr '[:upper:]' '[:lower:]'
        local phone=$(faker phone_number)
        
        # Generate random license information
        local license_states=("AL" "AK" "AZ" "AR" "CA" "CO" "CT" "DE" "FL" "GA" "HI" "ID" "IL" "IN" "IA" "KS" "KY" "LA" "ME" "MD" "MA" "MI" "MN" "MS" "MO" "MT" "NE" "NV" "NH" "NJ" "NM" "NY" "NC" "ND" "OH" "OK" "OR" "PA" "RI" "SC" "SD" "TN" "TX" "UT" "VT" "VA" "WA" "WV" "WI" "WY")
        local license_state=${license_states[$RANDOM % ${#license_states[@]}]}
        local license_number="${license_state}$(printf "%08d" $((10000000 + RANDOM % 90000000)))"
        
        # Generate expiration date 1-3 years in the future
        local current_year=$(date +%Y)
        local expiration_year=$((current_year + 1 + RANDOM % 3))
        local expiration_month=$(printf "%02d" $((1 + RANDOM % 12)))
        local expiration_day=$(printf "%02d" $((1 + RANDOM % 28)))
        local license_expiration="${expiration_year}-${expiration_month}-${expiration_day}"
        
        # Randomly select a carrier
        local carrier_id=${carrier_ids_array[$RANDOM % $num_carriers]}
        
        # Generate status (active, off duty, etc.)
        local status_options=("active" "off_duty" "on_break" "maintenance")
        local status=${status_options[$RANDOM % ${#status_options[@]}]}
        
        # Generate driver preferences as JSON
        local equipment_prefs=("dry_van" "refrigerated" "flatbed" "tanker" "auto_carrier")
        local pref_equipment=${equipment_prefs[$RANDOM % ${#equipment_prefs[@]}]}
        local max_distance=$((300 + RANDOM % 1000))
        
        local regions=("northeast" "southeast" "midwest" "southwest" "west" "northwest")
        local pref_regions=()
        local num_regions=$((1 + RANDOM % 3))
        for ((j=0; j<num_regions; j++)); do
            pref_regions+=("${regions[$RANDOM % ${#regions[@]}]}")
        done
        local pref_regions_json=$(IFS=,; echo "${pref_regions[*]}" | jq -R 'split(",")' | jq -c .)
        
        local major_cities=("New York" "Los Angeles" "Chicago" "Houston" "Phoenix" "Philadelphia" "San Antonio" "San Diego" "Dallas" "San Jose")
        local avoid_cities=()
        local num_avoid=$((RANDOM % 3))
        for ((j=0; j<num_avoid; j++)); do
            avoid_cities+=("${major_cities[$RANDOM % ${#major_cities[@]}]}")
        done
        local avoid_cities_json=$(IFS=,; echo "${avoid_cities[*]}" | jq -R 'split(",")' | jq -c .)
        
        local preferences=$(jq -n \
            --arg equipment "$pref_equipment" \
            --argjson regions "$pref_regions_json" \
            --arg max_distance "$max_distance" \
            --argjson avoid_cities "$avoid_cities_json" \
            '{load_types: [$equipment], max_distance_from_home: $max_distance|tonumber, preferred_regions: $regions, avoid_cities: $avoid_cities, notification_settings: {sms: true, email: (if $RANDOM%2 == 0 then true else false end), push: true}}')
        
        # Format SQL for driver
        echo "INSERT INTO driver (carrier_id, first_name, last_name, email, phone, license_number, license_state, license_expiration, status, preferences, created_at, updated_at, active) VALUES ('$carrier_id', '$first_name', '$last_name', '$email', '$phone', '$license_number', '$license_state', '$license_expiration', '$status', '$preferences', NOW(), NOW(), true);" >> $driver_data_file
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 20)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $driver_data_file > /dev/null
    
    # Clean up
    rm $driver_data_file
    
    echo -e "${GREEN}Successfully generated $NUM_DRIVERS drivers.${NC}"
    return 0
}

# Generates synthetic vehicle data
generate_vehicles() {
    echo -e "${BLUE}Generating $NUM_VEHICLES vehicles...${NC}"
    local counter=0
    local total=$NUM_VEHICLES
    
    # Get carrier IDs from the database
    local carrier_ids=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT carrier_id FROM carrier;" | tr -d ' ')
    local carrier_ids_array=($carrier_ids)
    local num_carriers=${#carrier_ids_array[@]}
    
    if [[ $num_carriers -eq 0 ]]; then
        echo -e "${RED}Error: No carriers found in database. Please generate carriers first.${NC}" >&2
        return 1
    fi
    
    # Create temp file for bulk insert
    local vehicle_data_file=$(mktemp)
    
    # Vehicle types and their typical weight capacities and dimensions
    local vehicle_types=("dry_van" "refrigerated" "flatbed" "tanker" "auto_carrier")
    local capacity_ranges=("42000-45000" "40000-44000" "45000-48000" "45000-50000" "35000-40000")
    local length_ranges=("48-53" "48-53" "48-53" "42-45" "75-80")
    
    # Generate the vehicle data
    for ((i=1; i<=NUM_VEHICLES; i++)); do
        # Randomly select a vehicle type
        local type_index=$((RANDOM % ${#vehicle_types[@]}))
        local vehicle_type=${vehicle_types[$type_index]}
        
        # Generate VIN (17 characters)
        local vin_chars="ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
        local vin=""
        for ((j=0; j<17; j++)); do
            vin+=${vin_chars:$((RANDOM % ${#vin_chars})):1}
        done
        
        # Generate plate number
        local plate_states=("AL" "AK" "AZ" "AR" "CA" "CO" "CT" "DE" "FL" "GA" "HI" "ID" "IL" "IN" "IA" "KS" "KY" "LA" "ME" "MD" "MA" "MI" "MN" "MS" "MO" "MT" "NE" "NV" "NH" "NJ" "NM" "NY" "NC" "ND" "OH" "OK" "OR" "PA" "RI" "SC" "SD" "TN" "TX" "UT" "VT" "VA" "WA" "WV" "WI" "WY")
        local plate_state=${plate_states[$RANDOM % ${#plate_states[@]}]}
        local plate_number=""
        for ((j=0; j<3; j++)); do
            plate_number+=${vin_chars:$((RANDOM % ${#vin_chars})):1}
        done
        plate_number+=" "
        for ((j=0; j<4; j++)); do
            plate_number+=${vin_chars:$((RANDOM % 10 + 17)):1}
        done
        
        # Get weight capacity range for this vehicle type
        local capacity_range=${capacity_ranges[$type_index]}
        local min_capacity=$(echo $capacity_range | cut -d'-' -f1)
        local max_capacity=$(echo $capacity_range | cut -d'-' -f2)
        local weight_capacity=$((min_capacity + RANDOM % (max_capacity - min_capacity + 1)))
        
        # Get length range for this vehicle type
        local length_range=${length_ranges[$type_index]}
        local min_length=$(echo $length_range | cut -d'-' -f1)
        local max_length=$(echo $length_range | cut -d'-' -f2)
        local length=$((min_length + RANDOM % (max_length - min_length + 1)))
        
        # Calculate volume capacity (length x width x height in cubic feet)
        local width=8  # Standard width in feet
        local height=9  # Standard height in feet for dry van/reefer
        if [[ "$vehicle_type" == "flatbed" ]]; then
            height=0  # Flatbeds don't have height
        fi
        local volume_capacity=$((length * width * height))
        
        # Generate dimensions as JSON
        local dimensions=$(jq -n \
            --arg length "$length" \
            --arg width "$width" \
            --arg height "$height" \
            '{length: $length|tonumber, width: $width|tonumber, height: $height|tonumber}')
        
        # Randomly select a carrier
        local carrier_id=${carrier_ids_array[$RANDOM % $num_carriers]}
        
        # Generate status (active, maintenance, etc.)
        local status_options=("active" "maintenance" "out_of_service")
        local status_weights=(85 10 5)  # 85% active, 10% maintenance, 5% out of service
        
        # Weighted random selection for status
        local rand=$((RANDOM % 100))
        local status_index=0
        local cumulative=0
        
        for ((j=0; j<${#status_weights[@]}; j++)); do
            cumulative=$((cumulative + ${status_weights[$j]}))
            if [[ $rand -lt $cumulative ]]; then
                status_index=$j
                break
            fi
        done
        
        local status=${status_options[$status_index]}
        
        # Format SQL for vehicle
        echo "INSERT INTO vehicle (carrier_id, vin, plate_number, plate_state, vehicle_type, weight_capacity, volume_capacity, dimensions, status, created_at, updated_at, active) VALUES ('$carrier_id', '$vin', '$plate_number', '$plate_state', '$vehicle_type', $weight_capacity, $volume_capacity, '$dimensions', '$status', NOW(), NOW(), true);" >> $vehicle_data_file
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 25)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $vehicle_data_file > /dev/null
    
    # Clean up
    rm $vehicle_data_file
    
    echo -e "${GREEN}Successfully generated $NUM_VEHICLES vehicles.${NC}"
    return 0
}

# Generates synthetic shipper data
generate_shippers() {
    echo -e "${BLUE}Generating $NUM_SHIPPERS shippers...${NC}"
    local counter=0
    local total=$NUM_SHIPPERS
    
    # Create temp file for bulk insert
    local shipper_data_file=$(mktemp)
    
    # Generate the shipper data
    for ((i=1; i<=NUM_SHIPPERS; i++)); do
        local company_name=$(faker company)
        local tax_id=$(printf "%09d" $((100000000 + RANDOM % 900000000)))
        
        # Generate address as JSON
        local street=$(faker street_address)
        local city=$(faker city)
        local state=$(faker state_abbr)
        local zip=$(faker zipcode)
        local address=$(jq -n \
            --arg street "$street" \
            --arg city "$city" \
            --arg state "$state" \
            --arg zip "$zip" \
            '{street: $street, city: $city, state: $state, zip: $zip}')
        
        # Generate contact info as JSON
        local contact_name=$(faker name)
        local phone=$(faker phone_number)
        local email=$(echo $company_name | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]')@example.com
        local contact_info=$(jq -n \
            --arg name "$contact_name" \
            --arg phone "$phone" \
            --arg email "$email" \
            '{name: $name, phone: $phone, email: $email}')
        
        # Generate credit rating (1.0-5.0)
        local credit_rating=$(awk -v min=1.0 -v max=5.0 'BEGIN{srand(); print min+rand()*(max-min)}')
        credit_rating=$(printf "%.1f" $credit_rating)
        
        # Format SQL for shipper
        echo "INSERT INTO shipper (name, tax_id, address, contact_info, credit_rating, created_at, updated_at, active) VALUES ('$company_name', '$tax_id', '$address', '$contact_info', $credit_rating, NOW(), NOW(), true);" >> $shipper_data_file
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 10)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $shipper_data_file > /dev/null
    
    # Clean up
    rm $shipper_data_file
    
    echo -e "${GREEN}Successfully generated $NUM_SHIPPERS shippers.${NC}"
    return 0
}

# Generates synthetic load data
generate_loads() {
    echo -e "${BLUE}Generating $NUM_LOADS loads...${NC}"
    local counter=0
    local total=$NUM_LOADS
    
    # Get shipper IDs from the database
    local shipper_ids=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT shipper_id FROM shipper;" | tr -d ' ')
    local shipper_ids_array=($shipper_ids)
    local num_shippers=${#shipper_ids_array[@]}
    
    if [[ $num_shippers -eq 0 ]]; then
        echo -e "${RED}Error: No shippers found in database. Please generate shippers first.${NC}" >&2
        return 1
    fi
    
    # Create temp files for bulk insert
    local load_data_file=$(mktemp)
    local location_data_file=$(mktemp)
    
    # Define major cities and their approximate coordinates for realistic origins/destinations
    declare -A cities
    cities["New York, NY"]="40.7128,-74.0060"
    cities["Los Angeles, CA"]="34.0522,-118.2437"
    cities["Chicago, IL"]="41.8781,-87.6298"
    cities["Houston, TX"]="29.7604,-95.3698"
    cities["Phoenix, AZ"]="33.4484,-112.0740"
    cities["Philadelphia, PA"]="39.9526,-75.1652"
    cities["San Antonio, TX"]="29.4241,-98.4936"
    cities["San Diego, CA"]="32.7157,-117.1611"
    cities["Dallas, TX"]="32.7767,-96.7970"
    cities["San Jose, CA"]="37.3382,-121.8863"
    cities["Austin, TX"]="30.2672,-97.7431"
    cities["Jacksonville, FL"]="30.3322,-81.6557"
    cities["Fort Worth, TX"]="32.7555,-97.3308"
    cities["Columbus, OH"]="39.9612,-82.9988"
    cities["Charlotte, NC"]="35.2271,-80.8431"
    cities["Indianapolis, IN"]="39.7684,-86.1581"
    cities["San Francisco, CA"]="37.7749,-122.4194"
    cities["Seattle, WA"]="47.6062,-122.3321"
    cities["Denver, CO"]="39.7392,-104.9903"
    cities["Washington, DC"]="38.9072,-77.0369"
    cities["Boston, MA"]="42.3601,-71.0589"
    cities["Detroit, MI"]="42.3314,-83.0458"
    cities["Atlanta, GA"]="33.7490,-84.3880"
    cities["Miami, FL"]="25.7617,-80.1918"
    cities["Pittsburgh, PA"]="40.4406,-79.9959"
    cities["Minneapolis, MN"]="44.9778,-93.2650"
    cities["Cincinnati, OH"]="39.1031,-84.5120"
    cities["Cleveland, OH"]="41.4993,-81.6944"
    cities["St. Louis, MO"]="38.6270,-90.1994"
    cities["Tampa, FL"]="27.9506,-82.4572"
    
    # Convert associative array to indexed arrays for random selection
    city_names=("${!cities[@]}")
    
    # Equipment types and their probabilities
    equipment_types=("dry_van" "refrigerated" "flatbed" "tanker" "auto_carrier")
    equipment_probabilities=(60 20 15 4 1)  # Percentages
    
    # Load statuses and their probabilities
    load_statuses=("pending" "available" "reserved" "assigned" "in_transit" "delivered" "completed" "cancelled")
    status_probabilities=(5 15 5 20 30 10 10 5)  # Percentages
    
    # Generate the load data
    for ((i=1; i<=NUM_LOADS; i++)); do
        # Generate reference number
        local reference="LD-$(printf "%05d" $((10000 + RANDOM % 90000)))"
        
        # Select random origin and destination cities (ensure they're different)
        local origin_index=$((RANDOM % ${#city_names[@]}))
        local origin_city=${city_names[$origin_index]}
        
        local destination_index=$origin_index
        while [[ $destination_index -eq $origin_index ]]; do
            destination_index=$((RANDOM % ${#city_names[@]}))
        done
        local destination_city=${city_names[$destination_index]}
        
        # Get coordinates
        local origin_coords=${cities[$origin_city]}
        local destination_coords=${cities[$destination_city]}
        
        # Generate load description
        local commodities=("Electronics" "Furniture" "Food Products" "Clothing" "Paper Goods" "Building Materials" "Automotive Parts" "Medical Supplies" "Chemicals" "Farm Products")
        local commodity=${commodities[$RANDOM % ${#commodities[@]}]}
        local description="$commodity shipment from ${origin_city} to ${destination_city}"
        
        # Select equipment type based on probability
        local rand=$((RANDOM % 100))
        local equipment_index=0
        local cumulative=0
        
        for ((j=0; j<${#equipment_probabilities[@]}; j++)); do
            cumulative=$((cumulative + ${equipment_probabilities[$j]}))
            if [[ $rand -lt $cumulative ]]; then
                equipment_index=$j
                break
            fi
        done
        
        local equipment_type=${equipment_types[$equipment_index]}
        
        # Generate weight between 5,000 and 45,000 lbs
        local weight=$((5000 + RANDOM % 40001))
        
        # Generate dimensions based on equipment type
        local length=$((8 + RANDOM % 40))  # 8-48 feet
        local width=$((6 + RANDOM % 3))    # 6-8 feet
        local height=$((4 + RANDOM % 6))   # 4-10 feet
        
        if [[ "$equipment_type" == "flatbed" ]]; then
            height=$((1 + RANDOM % 4))  # Flatbeds typically have lower height
        fi
        
        local dimensions=$(jq -n \
            --arg length "$length" \
            --arg width "$width" \
            --arg height "$height" \
            '{length: $length|tonumber, width: $width|tonumber, height: $height|tonumber}')
        
        # Select load status based on probability
        local rand=$((RANDOM % 100))
        local status_index=0
        local cumulative=0
        
        for ((j=0; j<${#status_probabilities[@]}; j++)); do
            cumulative=$((cumulative + ${status_probabilities[$j]}))
            if [[ $rand -lt $cumulative ]]; then
                status_index=$j
                break
            fi
        done
        
        local status=${load_statuses[$status_index]}
        
        # Generate timeframes for pickup and delivery
        # Base date is today +/- 7 days depending on status
        local today=$(date +%Y-%m-%d)
        local base_date
        
        case $status in
            "pending"|"available"|"reserved")
                # Future loads (0-7 days ahead)
                local days_ahead=$((RANDOM % 8))
                base_date=$(date -d "$today + $days_ahead days" +%Y-%m-%d)
                ;;
            "assigned"|"in_transit")
                # Current loads (0-3 days ahead)
                local days_ahead=$((RANDOM % 4))
                base_date=$(date -d "$today + $days_ahead days" +%Y-%m-%d)
                ;;
            "delivered"|"completed"|"cancelled")
                # Past loads (1-7 days ago)
                local days_ago=$((1 + RANDOM % 7))
                base_date=$(date -d "$today - $days_ago days" +%Y-%m-%d)
                ;;
        esac
        
        # Pickup is base_date, delivery is 1-3 days later for completed loads
        # or 1-3 days in the future for current loads
        local pickup_date=$base_date
        local delivery_date
        
        if [[ "$status" == "delivered" || "$status" == "completed" ]]; then
            local transit_days=$((1 + RANDOM % 3))
            delivery_date=$(date -d "$pickup_date + $transit_days days" +%Y-%m-%d)
        else
            local transit_days=$((1 + RANDOM % 3))
            delivery_date=$(date -d "$pickup_date + $transit_days days" +%Y-%m-%d)
        fi
        
        # Generate time windows (4-hour windows)
        local pickup_earliest_hour=$((8 + RANDOM % 5))  # 8am-1pm
        local pickup_latest_hour=$((pickup_earliest_hour + 4))
        local pickup_earliest="${pickup_date}T$(printf "%02d" $pickup_earliest_hour):00:00"
        local pickup_latest="${pickup_date}T$(printf "%02d" $pickup_latest_hour):00:00"
        
        local delivery_earliest_hour=$((8 + RANDOM % 5))
        local delivery_latest_hour=$((delivery_earliest_hour + 4))
        local delivery_earliest="${delivery_date}T$(printf "%02d" $delivery_earliest_hour):00:00"
        local delivery_latest="${delivery_date}T$(printf "%02d" $delivery_latest_hour):00:00"
        
        # Generate rate (roughly $2-4 per mile, 40-60 cents per pound)
        # First, calculate approximate distance using a very simplified formula
        # (this is just for test data - real distance calculation would use mapping APIs)
        local origin_lat=$(echo $origin_coords | cut -d',' -f1)
        local origin_lon=$(echo $origin_coords | cut -d',' -f2)
        local dest_lat=$(echo $destination_coords | cut -d',' -f1)
        local dest_lon=$(echo $destination_coords | cut -d',' -f2)
        
        # Rough distance calculation using Haversine formula
        local distance=$(python3 -c "
import math
def haversine(lat1, lon1, lat2, lon2):
    R = 3959.87433  # Earth radius in miles
    dLat = math.radians(float(lat2) - float(lat1))
    dLon = math.radians(float(lon2) - float(lon1))
    lat1 = math.radians(float(lat1))
    lat2 = math.radians(float(lat2))
    a = math.sin(dLat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dLon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c
print(int(haversine($origin_lat, $origin_lon, $dest_lat, $dest_lon)))
")
        
        # Calculate rate based on distance and weight
        local rate_per_mile=$(awk -v min=2.00 -v max=4.00 'BEGIN{srand(); print min+rand()*(max-min)}')
        local rate_per_pound=$(awk -v min=0.40 -v max=0.60 'BEGIN{srand(); print min+rand()*(max-min)/100}')
        
        local distance_rate=$(echo "$distance * $rate_per_mile" | bc)
        local weight_rate=$(echo "$weight * $rate_per_pound" | bc)
        
        # Take the higher of the two rates and round to nearest $50
        local rate=$(echo "if ($distance_rate > $weight_rate) $distance_rate else $weight_rate" | bc)
        rate=$(echo "scale=0; ($rate + 25) / 50 * 50" | bc)
        
        # Randomly select a shipper
        local shipper_id=${shipper_ids_array[$RANDOM % $num_shippers]}
        
        # Generate special instructions
        local instructions_options=(
            "Please call 30 minutes before arrival."
            "Dock high only."
            "Lift gate required."
            "Driver must have PPE."
            "No appointment needed."
            "Driver unload."
            "Drop and hook."
            "Pallet exchange required."
            "Temperature monitoring required."
            "Hazardous materials documentation required."
            ""  # Empty for no special instructions
        )
        local special_instructions=${instructions_options[$RANDOM % ${#instructions_options[@]}]}
        
        # Format SQL for load and load locations
        local load_id="ld_$(printf "%05d" $i)"
        echo "INSERT INTO load (load_id, shipper_id, reference_number, description, equipment_type, weight, dimensions, status, pickup_earliest, pickup_latest, delivery_earliest, delivery_latest, offered_rate, special_instructions, created_at, updated_at) VALUES ('$load_id', '$shipper_id', '$reference', '$description', '$equipment_type', $weight, '$dimensions', '$status', '$pickup_earliest', '$pickup_latest', '$delivery_earliest', '$delivery_latest', $rate, '$special_instructions', NOW(), NOW());" >> $load_data_file
        
        # Generate location data for pickup
        local pickup_location_id="${load_id}_pickup"
        local pickup_city=$(echo $origin_city | cut -d',' -f1)
        local pickup_state=$(echo $origin_city | cut -d',' -f2 | tr -d ' ')
        local pickup_lat=$(echo $origin_coords | cut -d',' -f1)
        local pickup_lon=$(echo $origin_coords | cut -d',' -f2)
        local pickup_contact_name=$(faker name)
        local pickup_contact_phone=$(faker phone_number)
        local pickup_address=$(faker street_address)
        
        echo "INSERT INTO load_location (location_id, load_id, location_type, address, latitude, longitude, earliest_time, latest_time, contact_name, contact_phone, special_instructions) VALUES ('$pickup_location_id', '$load_id', 'pickup', '$pickup_address, $pickup_city, $pickup_state', $pickup_lat, $pickup_lon, '$pickup_earliest', '$pickup_latest', '$pickup_contact_name', '$pickup_contact_phone', '$special_instructions');" >> $location_data_file
        
        # Generate location data for delivery
        local delivery_location_id="${load_id}_delivery"
        local delivery_city=$(echo $destination_city | cut -d',' -f1)
        local delivery_state=$(echo $destination_city | cut -d',' -f2 | tr -d ' ')
        local delivery_lat=$(echo $destination_coords | cut -d',' -f1)
        local delivery_lon=$(echo $destination_coords | cut -d',' -f2)
        local delivery_contact_name=$(faker name)
        local delivery_contact_phone=$(faker phone_number)
        local delivery_address=$(faker street_address)
        
        echo "INSERT INTO load_location (location_id, load_id, location_type, address, latitude, longitude, earliest_time, latest_time, contact_name, contact_phone, special_instructions) VALUES ('$delivery_location_id', '$load_id', 'delivery', '$delivery_address, $delivery_city, $delivery_state', $delivery_lat, $delivery_lon, '$delivery_earliest', '$delivery_latest', '$delivery_contact_name', '$delivery_contact_phone', '$special_instructions');" >> $location_data_file
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 50)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $load_data_file > /dev/null
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $location_data_file > /dev/null
    
    # Clean up
    rm $load_data_file $location_data_file
    
    echo -e "${GREEN}Successfully generated $NUM_LOADS loads with pickup and delivery locations.${NC}"
    return 0
}

# Generates synthetic smart hub data
generate_smart_hubs() {
    echo -e "${BLUE}Generating $NUM_SMART_HUBS smart hubs...${NC}"
    local counter=0
    local total=$NUM_SMART_HUBS
    
    # Create temp file for bulk insert
    local hub_data_file=$(mktemp)
    
    # Strategic locations for smart hubs (major logistics centers and crossroads)
    declare -A hub_locations
    hub_locations["Chicago, IL"]="41.8781,-87.6298,Major midwest distribution hub"
    hub_locations["Dallas, TX"]="32.7767,-96.7970,Key southern logistics center"
    hub_locations["Atlanta, GA"]="33.7490,-84.3880,Southeast transportation hub"
    hub_locations["Kansas City, MO"]="39.0997,-94.5786,Central US distribution point"
    hub_locations["Memphis, TN"]="35.1495,-90.0490,Major freight hub with FedEx superhub"
    hub_locations["Columbus, OH"]="39.9612,-82.9988,Key distribution point for eastern US"
    hub_locations["Indianapolis, IN"]="39.7684,-86.1581,Crossroads of America"
    hub_locations["Allentown, PA"]="40.6084,-75.4902,Northeast logistics corridor"
    hub_locations["Louisville, KY"]="38.2527,-85.7585,UPS Worldport location"
    hub_locations["Phoenix, AZ"]="33.4484,-112.0740,Southwest logistics hub"
    hub_locations["Denver, CO"]="39.7392,-104.9903,Mountain region distribution center"
    hub_locations["Salt Lake City, UT"]="40.7608,-111.8910,Western hub with rail connections"
    hub_locations["Seattle, WA"]="47.6062,-122.3321,Pacific Northwest port hub"
    hub_locations["Los Angeles, CA"]="34.0522,-118.2437,Major West Coast port hub"
    hub_locations["Stockton, CA"]="37.9577,-121.2908,Northern California distribution"
    hub_locations["Houston, TX"]="29.7604,-95.3698,Gulf Coast logistics center"
    hub_locations["Jacksonville, FL"]="30.3322,-81.6557,Southeast port hub"
    hub_locations["Charlotte, NC"]="35.2271,-80.8431,Southeast distribution center"
    hub_locations["Harrisburg, PA"]="40.2732,-76.8867,Northeast corridor hub"
    hub_locations["St. Louis, MO"]="38.6270,-90.1994,Major river and rail hub"
    hub_locations["Nashville, TN"]="36.1627,-86.7816,Central southeast hub"
    hub_locations["Little Rock, AR"]="34.7465,-92.2896,Central south hub"
    hub_locations["Oklahoma City, OK"]="35.4676,-97.5164,Southern plains hub"
    hub_locations["Omaha, NE"]="41.2565,-95.9345,Upper midwest distribution"
    hub_locations["Minneapolis, MN"]="44.9778,-93.2650,Northern midwest hub"
    hub_locations["Detroit, MI"]="42.3314,-83.0458,Great Lakes logistics center"
    hub_locations["Buffalo, NY"]="42.8864,-78.8784,Northeast border hub"
    hub_locations["Albany, NY"]="42.6526,-73.7562,Northeast corridor connection"
    hub_locations["Portland, OR"]="45.5051,-122.6750,Pacific Northwest hub"
    hub_locations["Boise, ID"]="43.6150,-116.2023,Northwest regional hub"
    hub_locations["Las Vegas, NV"]="36.1699,-115.1398,Southwest distribution point"
    hub_locations["Reno, NV"]="39.5296,-119.8138,Western distribution center"
    hub_locations["Tucson, AZ"]="32.2226,-110.9747,Southwest corridor hub"
    hub_locations["El Paso, TX"]="31.7619,-106.4850,Border distribution center"
    hub_locations["San Antonio, TX"]="29.4241,-98.4936,South Texas hub"
    hub_locations["New Orleans, LA"]="29.9511,-90.0715,Gulf port hub"
    hub_locations["Mobile, AL"]="30.6954,-88.0399,Gulf Coast logistics point"
    hub_locations["Tampa, FL"]="27.9506,-82.4572,Central Florida hub"
    hub_locations["Miami, FL"]="25.7617,-80.1918,South Florida distribution center"
    hub_locations["Richmond, VA"]="37.5407,-77.4360,Mid-Atlantic hub"
    
    # Convert associative array to indexed arrays for selection
    hub_city_names=("${!hub_locations[@]}")
    
    # Shuffle the array to get random selection
    hub_city_names_shuffled=($(printf "%s\n" "${hub_city_names[@]}" | sort -R))
    
    # Hub types
    hub_types=("truck_stop" "distribution_center" "warehouse" "rest_area" "terminal")
    
    # Hub amenities options
    amenities_options=(
        "fuel,food,restrooms,showers,repair"
        "fuel,food,restrooms,showers,parking"
        "fuel,food,restrooms,parking"
        "food,restrooms,parking"
        "restrooms,parking"
        "fuel,restrooms,parking,repair"
        "fuel,food,restrooms,showers,parking,repair,lodging"
        "fuel,food,restrooms,lodging"
    )
    
    # Generate the smart hub data
    for ((i=1; i<=NUM_SMART_HUBS && i<=${#hub_city_names_shuffled[@]}; i++)); do
        local city=${hub_city_names_shuffled[$i-1]}
        local city_info=${hub_locations[$city]}
        
        local lat=$(echo $city_info | cut -d',' -f1)
        local lon=$(echo $city_info | cut -d',' -f2)
        local description=$(echo $city_info | cut -d',' -f3-)
        
        # Generate name based on city
        local city_name=$(echo $city | cut -d',' -f1)
        local hub_name_options=(
            "$city_name Logistics Hub"
            "$city_name Distribution Center"
            "$city_name Truck Stop"
            "$city_name Transit Center"
            "$city_name Freight Exchange"
            "$city_name Smart Hub"
        )
        local hub_name=${hub_name_options[$RANDOM % ${#hub_name_options[@]}]}
        
        # Select hub type
        local hub_type=${hub_types[$RANDOM % ${#hub_types[@]}]}
        
        # Select amenities
        local amenities=${amenities_options[$RANDOM % ${#amenities_options[@]}]}
        local amenities_json=$(echo $amenities | tr ',' '\n' | jq -R . | jq -s .)
        
        # Generate capacity (number of trucks that can be accommodated)
        local capacity=$((20 + RANDOM % 181))  # 20-200
        
        # Generate efficiency score (70-100)
        local efficiency_score=$((70 + RANDOM % 31))
        
        # Format SQL for smart hub
        echo "INSERT INTO smart_hub (hub_id, name, latitude, longitude, hub_type, amenities, capacity, efficiency_score, active, created_at, updated_at) VALUES ('hub_$(printf "%03d" $i)', '$hub_name', $lat, $lon, '$hub_type', '$amenities_json', $capacity, $efficiency_score, true, NOW(), NOW());" >> $hub_data_file
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 5)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $hub_data_file > /dev/null
    
    # Clean up
    rm $hub_data_file
    
    echo -e "${GREEN}Successfully generated $counter smart hubs.${NC}"
    return 0
}

# Generates synthetic driver position history
generate_driver_positions() {
    echo -e "${BLUE}Generating driver position history...${NC}"
    
    # Get driver IDs from the database
    local driver_ids=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT driver_id FROM driver LIMIT 50;" | tr -d ' ')
    local driver_ids_array=($driver_ids)
    local num_drivers=${#driver_ids_array[@]}
    
    if [[ $num_drivers -eq 0 ]]; then
        echo -e "${RED}Error: No drivers found in database. Please generate drivers first.${NC}" >&2
        return 1
    fi
    
    # For demonstration, we'll generate 24 hours of position history for a subset of drivers
    echo -e "  ${YELLOW}Generating 24 hours of position history for $num_drivers drivers...${NC}"
    
    # Create temp file for bulk insert
    local position_data_file=$(mktemp)
    
    # Define some common routes between major cities
    declare -A routes
    routes["Chicago-Detroit"]="41.8781,-87.6298:42.3314,-83.0458"
    routes["New York-Boston"]="40.7128,-74.0060:42.3601,-71.0589"
    routes["Los Angeles-San Francisco"]="34.0522,-118.2437:37.7749,-122.4194"
    routes["Dallas-Houston"]="32.7767,-96.7970:29.7604,-95.3698"
    routes["Miami-Orlando"]="25.7617,-80.1918:28.5383,-81.3792"
    routes["Seattle-Portland"]="47.6062,-122.3321:45.5051,-122.6750"
    routes["Denver-Salt Lake City"]="39.7392,-104.9903:40.7608,-111.8910"
    routes["Atlanta-Charlotte"]="33.7490,-84.3880:35.2271,-80.8431"
    routes["Philadelphia-Pittsburgh"]="39.9526,-75.1652:40.4406,-79.9959"
    routes["Phoenix-Las Vegas"]="33.4484,-112.0740:36.1699,-115.1398"
    routes["Minneapolis-Chicago"]="44.9778,-93.2650:41.8781,-87.6298"
    routes["St. Louis-Kansas City"]="38.6270,-90.1994:39.0997,-94.5786"
    routes["Cleveland-Detroit"]="41.4993,-81.6944:42.3314,-83.0458"
    routes["Indianapolis-Columbus"]="39.7684,-86.1581:39.9612,-82.9988"
    routes["San Antonio-Austin"]="29.4241,-98.4936:30.2672,-97.7431"
    
    # Convert associative array to indexed arrays for random selection
    route_names=("${!routes[@]}")
    
    # Generate position data for each driver
    local counter=0
    for driver_id in "${driver_ids_array[@]}"; do
        # Select a random route
        local route_index=$((RANDOM % ${#route_names[@]}))
        local route_name=${route_names[$route_index]}
        local route_coords=${routes[$route_name]}
        
        # Parse start and end coordinates
        local start_coords=$(echo $route_coords | cut -d':' -f1)
        local end_coords=$(echo $route_coords | cut -d':' -f2)
        
        local start_lat=$(echo $start_coords | cut -d',' -f1)
        local start_lon=$(echo $start_coords | cut -d',' -f2)
        local end_lat=$(echo $end_coords | cut -d',' -f1)
        local end_lon=$(echo $end_coords | cut -d',' -f2)
        
        # Calculate distance using Haversine formula
        local distance=$(python3 -c "
import math
def haversine(lat1, lon1, lat2, lon2):
    R = 3959.87433  # Earth radius in miles
    dLat = math.radians(float(lat2) - float(lat1))
    dLon = math.radians(float(lon2) - float(lon1))
    lat1 = math.radians(float(lat1))
    lat2 = math.radians(float(lat2))
    a = math.sin(dLat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dLon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c
print(int(haversine($start_lat, $start_lon, $end_lat, $end_lon)))
")
        
        # Determine how many hours this trip would take (assume avg speed of 55 mph)
        local hours=$((distance / 55))
        if [[ $hours -lt 2 ]]; then
            hours=2  # Minimum 2 hours for any trip
        fi
        
        # Generate position updates every 15 minutes for the duration of the trip
        local total_minutes=$((hours * 60))
        local intervals=$((total_minutes / 15))
        
        # Start time is a random time in the past 24 hours
        local now=$(date +%s)
        local start_time=$((now - RANDOM % 86400))  # Random time in the last 24 hours
        
        for ((j=0; j<=intervals; j++)); do
            # Calculate progress along the route (0.0 to 1.0)
            local progress=$(echo "scale=6; $j / $intervals" | bc)
            
            # Interpolate latitude and longitude
            local lat=$(echo "scale=6; $start_lat + ($end_lat - $start_lat) * $progress" | bc)
            local lon=$(echo "scale=6; $start_lon + ($end_lon - $start_lon) * $progress" | bc)
            
            # Calculate heading (simplified - just a general direction)
            local heading=$((RANDOM % 360))
            
            # Calculate speed (average 55 mph with some variation)
            local speed=$((45 + RANDOM % 20))
            
            # Calculate timestamp
            local timestamp=$((start_time + j * 15 * 60))
            local timestamp_str=$(date -d @$timestamp "+%Y-%m-%d %H:%M:%S")
            
            # Format SQL for position update
            echo "INSERT INTO driver_location (driver_id, latitude, longitude, heading, speed, accuracy, recorded_at) VALUES ('$driver_id', $lat, $lon, $heading, $speed, 5, '$timestamp_str');" >> $position_data_file
        done
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 5)) -eq 0 || $counter -eq $num_drivers ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${num_drivers}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $position_data_file > /dev/null
    
    # Clean up
    rm $position_data_file
    
    echo -e "${GREEN}Successfully generated position history for $num_drivers drivers.${NC}"
    return 0
}

# Generates synthetic driver efficiency scores
generate_driver_scores() {
    echo -e "${BLUE}Generating driver efficiency scores...${NC}"
    
    # Get driver IDs from the database
    local driver_ids=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT driver_id FROM driver;" | tr -d ' ')
    local driver_ids_array=($driver_ids)
    local num_drivers=${#driver_ids_array[@]}
    
    if [[ $num_drivers -eq 0 ]]; then
        echo -e "${RED}Error: No drivers found in database. Please generate drivers first.${NC}" >&2
        return 1
    fi
    
    # Create temp file for bulk insert
    local score_data_file=$(mktemp)
    
    # Generate score data for each driver
    local counter=0
    local total=$num_drivers
    
    for driver_id in "${driver_ids_array[@]}"; do
        # Generate base score components
        local empty_miles_score=$((60 + RANDOM % 41))    # 60-100
        local network_contribution_score=$((50 + RANDOM % 51))  # 50-100
        local on_time_score=$((70 + RANDOM % 31))        # 70-100
        local hub_utilization_score=$((40 + RANDOM % 61)) # 40-100
        local fuel_efficiency_score=$((60 + RANDOM % 41)) # 60-100
        
        # Calculate total score using weights from the spec
        # Empty Miles Reduction (30%), Network Contribution (25%), On-Time Performance (20%), 
        # Smart Hub Utilization (15%), Fuel Efficiency (10%)
        local total_score=$(echo "scale=2; ($empty_miles_score * 0.30) + ($network_contribution_score * 0.25) + ($on_time_score * 0.20) + ($hub_utilization_score * 0.15) + ($fuel_efficiency_score * 0.10)" | bc)
        total_score=$(printf "%.1f" $total_score)
        
        # Generate additional score factors as JSON
        local score_factors=$(jq -n \
            --arg empty_miles_percent "$(echo "scale=1; (100 - $empty_miles_score) / 2" | bc)%" \
            --arg on_time_percent "$(echo "scale=1; $on_time_score" | bc)%" \
            --arg hub_visits "$(echo "scale=0; $hub_utilization_score / 10" | bc)" \
            --arg mpg "$(echo "scale=1; 5.0 + ($fuel_efficiency_score / 20)" | bc)" \
            '{empty_miles_percent: $empty_miles_percent, on_time_percent: $on_time_percent, hub_visits: $hub_visits|tonumber, miles_per_gallon: $mpg|tonumber}')
        
        # Random timestamp in the past week
        local now=$(date +%s)
        local timestamp=$((now - RANDOM % 604800))  # Random time in the last week (604800 seconds)
        local timestamp_str=$(date -d @$timestamp "+%Y-%m-%d %H:%M:%S")
        
        # Format SQL for driver score
        echo "INSERT INTO driver_score (driver_id, total_score, empty_miles_score, network_contribution_score, on_time_score, hub_utilization_score, fuel_efficiency_score, score_factors, calculated_at) VALUES ('$driver_id', $total_score, $empty_miles_score, $network_contribution_score, $on_time_score, $hub_utilization_score, $fuel_efficiency_score, '$score_factors', '$timestamp_str');" >> $score_data_file
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 50)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $score_data_file > /dev/null
    
    # Clean up
    rm $score_data_file
    
    echo -e "${GREEN}Successfully generated efficiency scores for $num_drivers drivers.${NC}"
    return 0
}

# Generates synthetic load assignment data
generate_load_assignments() {
    echo -e "${BLUE}Generating load assignments...${NC}"
    
    # Get loads with status 'assigned', 'in_transit', 'delivered', 'completed'
    local assigned_loads=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT load_id FROM load WHERE status IN ('assigned', 'in_transit', 'delivered', 'completed');" | tr -d ' ')
    local assigned_loads_array=($assigned_loads)
    local num_loads=${#assigned_loads_array[@]}
    
    if [[ $num_loads -eq 0 ]]; then
        echo -e "${RED}Error: No eligible loads found in database. Please generate loads first.${NC}" >&2
        return 1
    fi
    
    # Get driver IDs from the database
    local driver_ids=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT driver_id FROM driver WHERE status IN ('active', 'off_duty');" | tr -d ' ')
    local driver_ids_array=($driver_ids)
    local num_drivers=${#driver_ids_array[@]}
    
    if [[ $num_drivers -eq 0 ]]; then
        echo -e "${RED}Error: No eligible drivers found in database.${NC}" >&2
        return 1
    fi
    
    # Get vehicle IDs from the database
    local vehicle_ids=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT vehicle_id FROM vehicle WHERE status = 'active';" | tr -d ' ')
    local vehicle_ids_array=($vehicle_ids)
    local num_vehicles=${#vehicle_ids_array[@]}
    
    if [[ $num_vehicles -eq 0 ]]; then
        echo -e "${RED}Error: No eligible vehicles found in database.${NC}" >&2
        return 1
    fi
    
    # Create temp files for bulk insert
    local assignment_data_file=$(mktemp)
    local status_data_file=$(mktemp)
    
    # Generate assignment data for each assigned load
    local counter=0
    local total=$num_loads
    
    for load_id in "${assigned_loads_array[@]}"; do
        # Get load details
        local load_details=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT status, pickup_earliest, pickup_latest, delivery_earliest, delivery_latest, offered_rate FROM load WHERE load_id = '$load_id';" | tr -d ' ')
        
        # Parse load details
        local status=$(echo $load_details | cut -d'|' -f1)
        local pickup_earliest=$(echo $load_details | cut -d'|' -f2)
        local pickup_latest=$(echo $load_details | cut -d'|' -f3)
        local delivery_earliest=$(echo $load_details | cut -d'|' -f4)
        local delivery_latest=$(echo $load_details | cut -d'|' -f5)
        local offered_rate=$(echo $load_details | cut -d'|' -f6)
        
        # Randomly select a driver and vehicle
        local driver_id=${driver_ids_array[$RANDOM % $num_drivers]}
        local vehicle_id=${vehicle_ids_array[$RANDOM % $num_vehicles]}
        
        # Adjust rate slightly (±5%)
        local rate_adjustment=$(echo "scale=2; ($offered_rate * (0.95 + ($RANDOM % 11) / 100))" | bc)
        local agreed_rate=$(printf "%.2f" $rate_adjustment)
        
        # Determine assignment type
        local assignment_types=("direct" "relay")
        local assignment_type=${assignment_types[$RANDOM % ${#assignment_types[@]}]}
        
        # Generate timestamps based on load status
        local now=$(date +%s)
        local pickup_earliest_ts=$(date -d "$pickup_earliest" +%s)
        local pickup_latest_ts=$(date -d "$pickup_latest" +%s)
        local delivery_earliest_ts=$(date -d "$delivery_earliest" +%s)
        local delivery_latest_ts=$(date -d "$delivery_latest" +%s)
        
        # Format SQL for assignment
        local assignment_id="${load_id}_assignment"
        echo "INSERT INTO load_assignment (assignment_id, load_id, driver_id, vehicle_id, assignment_type, status, agreed_rate, created_at, updated_at) VALUES ('$assignment_id', '$load_id', '$driver_id', '$vehicle_id', '$assignment_type', '$status', $agreed_rate, NOW(), NOW());" >> $assignment_data_file
        
        # Generate assignment status history based on load status
        local status_history=()
        local status_timestamps=()
        
        # Always include assigned status
        status_history+=("assigned")
        
        # Random timestamp between pickup_earliest and now
        local assigned_ts=$((pickup_earliest_ts - (86400 + RANDOM % 172800)))  # 1-3 days before pickup
        status_timestamps+=("$(date -d @$assigned_ts "+%Y-%m-%d %H:%M:%S")")
        
        if [[ "$status" == "in_transit" || "$status" == "delivered" || "$status" == "completed" ]]; then
            status_history+=("in_transit")
            
            # Random timestamp between assigned and pickup_latest
            local in_transit_ts=$((assigned_ts + (3600 + RANDOM % 86400)))  # 1 hour to 1 day after assigned
            status_timestamps+=("$(date -d @$in_transit_ts "+%Y-%m-%d %H:%M:%S")")
            
            if [[ "$status" == "delivered" || "$status" == "completed" ]]; then
                status_history+=("at_pickup")
                
                # Random timestamp around pickup window
                local at_pickup_ts=$((pickup_earliest_ts + RANDOM % (pickup_latest_ts - pickup_earliest_ts)))
                if [[ $at_pickup_ts -lt $in_transit_ts ]]; then
                    at_pickup_ts=$((in_transit_ts + 1800))  # At least 30 min after in_transit
                fi
                status_timestamps+=("$(date -d @$at_pickup_ts "+%Y-%m-%d %H:%M:%S")")
                
                status_history+=("loaded")
                
                # Random timestamp shortly after at_pickup
                local loaded_ts=$((at_pickup_ts + (1800 + RANDOM % 7200)))  # 30 min to 2 hours after at_pickup
                status_timestamps+=("$(date -d @$loaded_ts "+%Y-%m-%d %H:%M:%S")")
                
                status_history+=("in_transit")
                
                # Random timestamp shortly after loaded
                local in_transit2_ts=$((loaded_ts + (900 + RANDOM % 3600)))  # 15 min to 1 hour after loaded
                status_timestamps+=("$(date -d @$in_transit2_ts "+%Y-%m-%d %H:%M:%S")")
                
                status_history+=("at_dropoff")
                
                # Random timestamp around delivery window
                local at_dropoff_ts=$((delivery_earliest_ts + RANDOM % (delivery_latest_ts - delivery_earliest_ts)))
                if [[ $at_dropoff_ts -lt $in_transit2_ts ]]; then
                    at_dropoff_ts=$((in_transit2_ts + (3600 + RANDOM % 7200)))  # 1-3 hours after in_transit
                fi
                status_timestamps+=("$(date -d @$at_dropoff_ts "+%Y-%m-%d %H:%M:%S")")
                
                status_history+=("delivered")
                
                # Random timestamp shortly after at_dropoff
                local delivered_ts=$((at_dropoff_ts + (1800 + RANDOM % 7200)))  # 30 min to 2 hours after at_dropoff
                status_timestamps+=("$(date -d @$delivered_ts "+%Y-%m-%d %H:%M:%S")")
                
                if [[ "$status" == "completed" ]]; then
                    status_history+=("completed")
                    
                    # Random timestamp shortly after delivered
                    local completed_ts=$((delivered_ts + (1800 + RANDOM % 86400)))  # 30 min to 1 day after delivered
                    status_timestamps+=("$(date -d @$completed_ts "+%Y-%m-%d %H:%M:%S")")
                fi
            fi
        fi
        
        # Insert assignment status history
        for ((i=0; i<${#status_history[@]}; i++)); do
            local status_id="${assignment_id}_status_$i"
            local status_value=${status_history[$i]}
            local status_timestamp=${status_timestamps[$i]}
            
            # Generate random location for this status update
            local lat=$(echo "scale=6; 35.0 + (10.0 * $RANDOM / 32767)" | bc)
            local lon=$(echo "scale=6; -100.0 + (20.0 * $RANDOM / 32767)" | bc)
            
            # Generate status details as JSON
            local status_details=$(jq -n \
                --arg note "Status updated to $status_value" \
                '{note: $note, automatic: true}')
            
            echo "INSERT INTO assignment_status (status_id, assignment_id, status, status_details, latitude, longitude, recorded_at) VALUES ('$status_id', '$assignment_id', '$status_value', '$status_details', $lat, $lon, '$status_timestamp');" >> $status_data_file
        done
        
        # Update progress
        counter=$((counter + 1))
        if [[ $((counter % 25)) -eq 0 || $counter -eq $total ]]; then
            echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
        fi
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $assignment_data_file > /dev/null
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $status_data_file > /dev/null
    
    # Clean up
    rm $assignment_data_file $status_data_file
    
    echo -e "${GREEN}Successfully generated assignments and status history for $num_loads loads.${NC}"
    return 0
}

# Generates synthetic market rate data
generate_market_rates() {
    echo -e "${BLUE}Generating market rate data...${NC}"
    
    # Create temp file for bulk insert
    local rate_data_file=$(mktemp)
    
    # Define major regions for origin/destination
    regions=("Northeast" "Southeast" "Midwest" "Southwest" "West" "Northwest")
    
    # Equipment types
    equipment_types=("dry_van" "refrigerated" "flatbed" "tanker" "auto_carrier")
    
    # Generate 90 days of historical rate data
    echo -e "  ${YELLOW}Generating 90 days of historical rate data for major lanes...${NC}"
    
    # Current date and time
    local now=$(date +%s)
    
    # Counter for progress
    local counter=0
    local total=$((${#regions[@]} * ${#regions[@]} * ${#equipment_types[@]} * 90))
    
    # Generate 90 days of data
    for ((day=0; day<90; day++)); do
        # Calculate timestamp for this day
        local day_ts=$((now - (89-day) * 86400))  # Start from 90 days ago
        local day_date=$(date -d @$day_ts "+%Y-%m-%d")
        
        # Day of week (0-6, Sunday is 0)
        local day_of_week=$(date -d @$day_ts "+%w")
        
        # Month (1-12)
        local month=$(date -d @$day_ts "+%m")
        
        # Generate data for each origin-destination pair and equipment type
        for origin_idx in "${!regions[@]}"; do
            local origin_region=${regions[$origin_idx]}
            
            for dest_idx in "${!regions[@]}"; do
                # Skip same region
                if [[ $origin_idx -eq $dest_idx ]]; then
                    continue
                fi
                
                local destination_region=${regions[$dest_idx]}
                
                # Base rates for each lane (these would come from market data)
                # We'll generate synthetic rates based on distance and region patterns
                local distance_factor=$((1 + (origin_idx + dest_idx) % 5))  # 1-5 factor
                local base_rate=$((1.5 + distance_factor * 0.5))  # $1.50-$4.00 per mile
                
                for equipment_type in "${equipment_types[@]}"; do
                    # Adjust rate by equipment type
                    local equipment_multiplier=1.0
                    case $equipment_type in
                        "dry_van")
                            equipment_multiplier=1.0
                            ;;
                        "refrigerated")
                            equipment_multiplier=1.25
                            ;;
                        "flatbed")
                            equipment_multiplier=1.15
                            ;;
                        "tanker")
                            equipment_multiplier=1.4
                            ;;
                        "auto_carrier")
                            equipment_multiplier=1.3
                            ;;
                    esac
                    
                    # Adjust for day of week (weekends typically higher)
                    local day_multiplier=1.0
                    if [[ $day_of_week -eq 0 || $day_of_week -eq 6 ]]; then
                        day_multiplier=1.1
                    fi
                    
                    # Adjust for seasonality
                    local season_multiplier=1.0
                    case $month in
                        "01"|"02"|"12")  # Winter
                            season_multiplier=1.05
                            ;;
                        "06"|"07"|"08")  # Summer
                            season_multiplier=1.15
                            ;;
                        "11")  # Holiday season
                            season_multiplier=1.2
                            ;;
                    esac
                    
                    # Add some randomness
                    local random_factor=$(echo "scale=2; 0.9 + ($RANDOM % 21) / 100" | bc)
                    
                    # Calculate final rate
                    local rate=$(echo "scale=2; $base_rate * $equipment_multiplier * $day_multiplier * $season_multiplier * $random_factor" | bc)
                    
                    # Determine min and max rates (±10% from average)
                    local min_rate=$(echo "scale=2; $rate * 0.9" | bc)
                    local max_rate=$(echo "scale=2; $rate * 1.1" | bc)
                    
                    # Random sample size (10-50)
                    local sample_size=$((10 + RANDOM % 41))
                    
                    # Format SQL for market rate
                    echo "INSERT INTO market_rate (rate_id, origin_region, destination_region, equipment_type, average_rate, min_rate, max_rate, sample_size, recorded_at) VALUES (gen_random_uuid(), '$origin_region', '$destination_region', '$equipment_type', $rate, $min_rate, $max_rate, $sample_size, '$day_date');" >> $rate_data_file
                    
                    # Update progress
                    counter=$((counter + 1))
                    if [[ $((counter % 100)) -eq 0 || $counter -eq $total ]]; then
                        echo -e "  ${GREEN}Progress: ${counter}/${total}${NC}"
                    fi
                done
            done
        done
    done
    
    # Insert the data into the database
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $rate_data_file > /dev/null
    
    # Clean up
    rm $rate_data_file
    
    echo -e "${GREEN}Successfully generated market rate data.${NC}"
    return 0
}

# Main function that orchestrates the test data generation process
main() {
    # Parse arguments
    parse_arguments "$@"
    if [[ $? -ne 0 ]]; then
        return 1
    fi
    
    # Print banner
    echo -e "${BLUE}=========================================================${NC}"
    echo -e "${BLUE}   AI-driven Freight Optimization Platform              ${NC}"
    echo -e "${BLUE}   Test Data Generator                                  ${NC}"
    echo -e "${BLUE}=========================================================${NC}"
    echo
    
    # Check dependencies
    echo -e "${YELLOW}Checking dependencies...${NC}"
    check_dependencies
    if [[ $? -ne 0 ]]; then
        return 1
    fi
    echo -e "${GREEN}All dependencies are available.${NC}"
    echo
    
    # Test database connection
    echo -e "${YELLOW}Testing database connection...${NC}"
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
        echo -e "${RED}Error: Could not connect to database. Please check your credentials and try again.${NC}" >&2
        return 1
    fi
    echo -e "${GREEN}Database connection successful.${NC}"
    echo
    
    # Generate data
    generate_carriers
    generate_drivers
    generate_vehicles
    generate_shippers
    generate_loads
    generate_smart_hubs
    generate_driver_positions
    generate_driver_scores
    generate_load_assignments
    generate_market_rates
    
    # Print summary
    echo
    echo -e "${BLUE}=========================================================${NC}"
    echo -e "${GREEN}Test data generation complete!${NC}"
    echo -e "${BLUE}=========================================================${NC}"
    echo
    echo -e "${YELLOW}Summary of generated data:${NC}"
    echo -e "  ${BLUE}Carriers:${NC} $NUM_CARRIERS"
    echo -e "  ${BLUE}Drivers:${NC} $NUM_DRIVERS"
    echo -e "  ${BLUE}Vehicles:${NC} $NUM_VEHICLES"
    echo -e "  ${BLUE}Shippers:${NC} $NUM_SHIPPERS"
    echo -e "  ${BLUE}Loads:${NC} $NUM_LOADS"
    echo -e "  ${BLUE}Smart Hubs:${NC} $NUM_SMART_HUBS"
    echo -e "  ${BLUE}Driver Positions:${NC} Generated for a subset of drivers"
    echo -e "  ${BLUE}Driver Scores:${NC} Generated for all drivers"
    echo -e "  ${BLUE}Load Assignments:${NC} Generated for applicable loads"
    echo -e "  ${BLUE}Market Rates:${NC} 90 days of historical data for major lanes"
    echo
    
    return 0
}

# Execute main function with all command line arguments
main "$@"
exit $?