import json
import time

def run_benchmark(file_path):
    print(f"Loading {file_path} into memory... (This might take a moment)")
    
    # 1. Load the raw JSON dataset
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            movies = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {file_path}. Make sure it is in the same directory.")
        return
        
    print(f"Successfully loaded {len(movies)} movie records.\n")

    # 2. Define our test queries (simulating user searches)
    search_terms = [
        "batman", "avatar", "inception", "matrix", "interstellar",
        "marvel", "spider-man", "nolan", "tarantino", "action"
    ]
    
    # Multiply the queries to create a heavier workload (e.g., 10 terms * 50 = 500 queries)
    # You can increase the multiplier if the script finishes too fast.
    queries = search_terms * 50 
    
    print(f"Executing {len(queries)} naive linear searches directly on the JSON file...")
    
    # 3. Start the timer
    start_time = time.time()
    total_matches_found = 0

    # 4. Execute the $O(N)$ linear search
    for query in queries:
        # For every query, Python must check every single movie one by one
        for movie in movies:
            # We use .get() safely in case some rows are missing the 'title' key
            title = str(movie.get('title', '')).lower()
            
            if query in title:
                total_matches_found += 1

    # 5. Stop the timer
    end_time = time.time()
    
    # 6. Calculate Metrics
    total_time = end_time - start_time
    qps = len(queries) / total_time if total_time > 0 else 0

    # 7. Print the Results
    print()
    print()
    print("NAIVE PYTHON JSON SEARCH - RESULTS")
    print()
    print(f"Total Queries Executed : {len(queries)}")
    print(f"Total Matches Found    : {total_matches_found}")
    print(f"Total Time Taken       : {total_time:.4f} seconds")
    print()
    print(f"FINAL QPS              : {qps:.2f} Queries / Sec")
    print()
    print("Conclusion: Sequential scanning is highly inefficient.")
    print("Distributed In-Memory Indexing (Solr) is strictly required.")

if __name__ == "__main__":
    # Ensure your json file is named correctly here
    run_benchmark('movies_solr.json')