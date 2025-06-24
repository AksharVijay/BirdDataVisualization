---------------------------<<Bird Sightings Data Visualization>>------------------------------------------
------------------------------------------------------------------------------------------------------------------------

This project is a spatial-temporal visualization of bird sightings, It enables researchers to explore patterns in bird species sightings over time and across geographic locations. This data visualzation helps researchers in understanding and analysing the patterns like where different species of birds were sighted and when the sightings occurred and they vary temporally. 

Users can interact with:
1. A dynamic map showing bird sightings with species-specific markers
2. Filters for species, date ranges, seasons and snow depth
3. Charts that show trends over time and frequency of sightings
4. Interactive tooltips that display sighting details on hover which includes Name, Scientific name, date of appearance and season

--------------------------<<Tech Stack>>--------------------------------------------

1. Frontend: HTML5, CSS3, JavaScript
2. Mapping: [Leaflet.js](https://leafletjs.com/)
3. ECharts: [echarts.js](https://echartsjs.com/index.html) 
4. Flatpickr: [flatpickr](https://flatpickr.js.org/)
5. Chroma: [chroma.js]
6. Data: CSV converted to JSON (BirdData.csv + SpeciesCode.csv)
7. Backend: Python for data cleaning & transformation via Jupyter Notebook

-----------<<Generation of Public Key & SSH Login Steps>>---------------------------

1. Go to terminal and run below ssh command to generate the private-public key pair
    ```bash
    ssh-keygen -t rsa
    ```
2. Share the public key to get the hostname, username and password, granted SSH and X2Go access to a virtual machine.
3. SSH Login - Login via SSH using the private key
    ```bash
    ssh -i /path/to/your/private-key.pem <username>@<hostname>
    ```
4. After logging in run sudo commands with elevated privilages like
    ```bash
    sudo <command>
    ```
5. This prompts you to enter the password - Enter the password

---------------<<Project Environment>>-------------------------------

1. As per the instruction in ~/Desktop/Data --> README file - R, Python, node.js, npm, IDEs were preinstalled and instructed to install the required libraries that are used for data visualization.

2. README file also gave insights on the dataset structure, context and types.

3. CSV files are placed in ~/Desktop/Data location
    BirdData.csv & SpeciesCode.csv  --> Bird Sighting related data
    NeolothicData.csv --> Neolithic Farming realted data

4. ~/Desktop/Data --> Jupyter Instruction file 

----------------------<<Project Folder and File Structure Details>>--------------------------

1. Created a directory BirdVisualization_akan291 with suitable permissions --> chmod 700 ~/Desktop/BirdVisualization_akan291
2. BirdVisualization_akan291/
│
├── Data/           # CSV and JSON data files
├── notebooks/      # Jupyter notebooks for analysis and visualization
├── scripts/        # Python scripts for preprocessing and utilities
├── outputs/        # Any generated files or visualizations
├── README.md       # This documentation
└── WebApp          # HTML, CSS, and JavaScript files for interactive visualization

3. Pulled the csv file in ~/Desktop/Data to ~/Desktop/BirdVisualization_akan291/Data
    ```bash
    mv ~/Desktop/Data/BirdSightings/BirdData.csv Data/
    mv ~/Desktop/Data/BirdSightings/SpeciesCode.csv Data/
    ```

----------------------<<Installation of python, libraries and activation of Virtual Environment>>------------------

1. Installed the python3-venv Package (venv Module)
    ```bash
    sudo apt install python3.12-venv
    ```

2. Created and Activated a Virtual Environment inside the project folder (~/Desktop/BirdVisualization_akan291)
    ```bash
    cd ~/Desktop/BirdVisualization_akan291
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3. Install python libraries
    ```bash
    pip install pandas numpy matplotlib
    ```
    This keeps everything inside .venv, safe and isolated from the System Python as this will not break the shared environment

4. Install Jupyter notebook in current .venv
    ```bash
    sudo apt install jupyter-notebook
    ```

5. Install Jupyter in current .venv
    ```bash
    pip install notebook
    ```

5. Launch the Jupyter 
    ```bash
    jupyter-notebook --NotebookApp.token=''
    ```

6. Go to seperate terminal to do port forwarding
    ```bash
    ssh -i /path/to/your/private-key.pem -L 8888:localhost:8888 <username>@h<hostname>
    ```

7. Go to browser and launch http://127.0.0.1:8888/tree?

<<NOTE>> During the installation of required python libraries (pandas, numpy etc.) I have used the traditional venv approach (like the above mentioned method), by this we can achieve the isolated environment and reproducibility. Later, learnt that same goal could have been achieved in a more efficient way through modern tools like UV or PIPX which would have avoided the system level installation.

<<Alternative Approach>>-------
    ```bash
    uv pip install pandas numpy
    ```

------------------<<How to launch the Jupyter in a normal scenario>>--------------------------

1. Go to terminal and connect to VM by using the SSH command
    ssh -i /path/to/your/private-key.pem <username>@<hostname>

2. cd ~/Desktop/BirdVisualization_akan291

3. source .venv/bin/activate 

4. jupyter-notebook --NotebookApp.token=''

5. Go to another terminal and do port forwarding
    ssh -i /path/to/your/private-key.pem -L 8888:localhost:8888 <username>@<hostname>

6. Go to the browser and launch http://127.0.0.1:8888/tree?


-----------------------<<Data Cleaning and Transformation>>-------------------------------------

1. Go to Jupyter that was launched in the browser click on the notebook folder

2. Click on the New button on the top-right of the window --> click on Python3 (ipykernel)

3. Rename the file 01_Data_Exploration_Cleaning.ipynb where you can write the python commands to clean the raw data

4. Import the required libraries like panda, numpy
    
    import pandas as pd
    import numpy as np

5. Read the raw data (.csv) files using panda
    
    bird_df = pd.read_csv("../Data/BirdData.csv")
    species_df = pd.read_csv("../Data/SpeciesCode.csv")

6. Display both the csv files to check on the columns and type of data available
    
    print("Bird Dataset:")
    display(bird_df.head())
    print("Species Code Dataset:")
    display(species_df.head())

7. Check if there are any null values in the csv files and check how many null values each column has
    
    print("Missing values in bird data:")
    print(bird_df.isnull().sum())

    print("\nMissing values in species data:")
    print(species_df.isnull().sum())

8. Drop the null values and clean the data in csv files
    
    bird_df_cleaned = bird_df.dropna()
    species_df_cleaned = species_df.dropna()

    bird_df_cleaned.reset_index(drop=True, inplace=True)
    species_df_cleaned.reset_index(drop=True, inplace=True)

9. Since both the file has a common column SPECIES_CODE and we can see the possibility of merging because, SpeciesCode.csv is a metadata and BirdData.csv is an Observation data. Put a left join on both the files and drop the redundant SPECIES_CODE column.
    
    merged_df = bird_df_cleaned.merge(
        species_df_cleaned,
        left_on="species_code",
        right_on="SPECIES_CODE",
        how="left"
    )

    if 'SPECIES_CODE' in merged_df.columns:
        merged_df.drop(columns=['SPECIES_CODE'], inplace=True)

10. Using Month column in the merged file we can compute the season that will help in filtering the bird sighting based on the season. On display of merged file we can see extra column (Month) added so we can drop that column.
    
    def get_season(month):
        if month in [12, 1, 2]:
            return 'Winter'
        elif month in [3, 4, 5]:
            return 'Spring'
        elif month in [6, 7, 8]:
            return 'Summer'
        else:
            return 'Autumn'
    merged_df['Month'] = pd.to_datetime(merged_df['date'], errors='coerce').dt.month

    merged_df['season'] = merged_df['Month'].apply(get_season)

    merged_df.drop(columns=['Month'], inplace=True)

11. Merged file has three columns (Year, Month, Day) that are coming from the BirdData.csv file that can be combined to form the Date column. So, we are removing three columns and adding one column which is efficient in data visualization.
    merged_df['date'] = pd.to_datetime(merged_df[['Year', 'Month', 'Day']], errors='coerce')

    merged_df = merged_df.dropna(subset=['date'])

    merged_df.drop(columns=['Month', 'Day', 'Year'], inplace=True)

    print("Updated DataFrame with 'date' column:")

    display(merged_df.head())  --> display the merged file. Check the columns

12. Standardise the column names - convert it to lower case and remove the space between the words instead put underscore
    merged_df.columns = merged_df.columns.str.strip().str.lower().str.replace(" ", "_")

13. Set the boundaries to the column latitude and longitude. Any values beyond this boundaries is not a possible valid values for latitude and longitude.

    merged_df[(merged_df['latitude'] < -90) | (merged_df['latitude'] > 90) | 
    (merged_df['longitude'] < -180) | (merged_df['longitude'] > 180)]

14. There are few columns in the merged file which are not used in this data visualization. As of now we can drop those columns.

    columns_to_drop = ['sub_id', 'obs_id', 'proj_period_id']
    merged_df.drop(columns=[col for col in columns_to_drop if col in merged_df.columns], inplace=True)

15. Convert the merged file to csv file and place it in Data folder.

    merged_df.to_csv("../Data/Cleaned_BirdData_15June.csv", index=False)

16. Have one copy of JSON file as well which will be used in JavaScript for Data Visualization. This is also placed in Data folder.

    merged_df.to_json("../Data/Cleaned_BirdData_15June.json", orient="records", indent=2)


------------------------<<Data Visualization Development in VS Code>>---------------------------

1. Transfer the CSV file and JSON file to your local device. Merged data file (CSV) helps us to analyse the cleaned and transformed data whereas JSON file is used in the Data Visualization development.

    scp -i /path/to/your/private-key.pem <username>@<hostname>:'~/Desktop/BirdVisualization_akan291/Data/*.json' /c/Users/aksha/Downloads

2. Create a folder in your local device place the merged data (JSON) file inside the folder. Open the folder in the VS code and create the appropriate index.html, styles.css and scripts.js file.

3. Using the cleaned and tranformed merged json file start coding the data visualization in VS Code.

-------------------------<<Transfer of HTML5, CSS3, JavaScript and JSON files to VM>>---------------

1. After completing the Data Visualization development in the VS code, transfer the index.html, styles.css, scripts.js and json files to /Desktop/BirdVisulisation_akan291/WebApp

2. Go to Git Bash

    scp -i /path/to/your/private-key.pem /path/to/your/project-folder/index.html techassess@130.216.217.220:/home/techassess/Desktop/BirdVisualization_akan291/WebApp/index.html

    scp -i /path/to/your/private-key.pem /path/to/your/project-folder/styles.css techassess@130.216.217.220:/home/techassess/Desktop/BirdVisualization_akan291/WebApp/styles.css

    scp -i /path/to/your/private-key.pem /path/to/your/project-folder/script.js techassess@130.216.217.220:/home/techassess/Desktop/BirdVisualization_akan291/WebApp/scripts.js

    scp -i /path/to/your/private-key.pem /path/to/your/project-folder/Cleaned_BirdData_15June.json techassess@130.216.217.220:/home/techassess/Desktop/BirdVisualization_akan291/WebApp/Cleaned_BirdData_15June.json

    scp -i /path/to/your/private-key.pem /path/to/your/project-folder/Cleaned_BirdData_15June.csv techassess@130.216.217.220:/home/techassess/Desktop/BirdVisualization_akan291/WebApp/Cleaned_BirdData_15June.csv

    scp -i /path/to/your/private-key.pem /path/to/your/project-folder/Bird_Species_Report.pdf techassess@130.216.217.220:/home/techassess/Desktop/BirdVisualization_akan291/WebApp/Bird_Species_Report.pdf

    scp -i /path/to/your/private-key.pem /path/to/your/project-folder/README.md techassess@130.216.217.220:/home/techassess/Desktop/BirdVisualization_akan291/README.md

3. Check the files in Jupyter under WebApp folder

-------------------------<<Port Tunnel and Launching the Visualization app on Jupyter>>---------

1. Go to terminal and run the below command to do the port tunnelling
    $ ssh -i /path/to/your/private-key.pem -L 9000:localhost:8080 <username>@<hostname>

2. Go to Jupyter --> navigate to WebApp folder and click on New button on the top-right of the window. Click on the Terminal.

    techassess@ta-1:~/Desktop/BirdVisualization_akan291$ cd WebApp

    techassess@ta-1:~/Desktop/BirdVisualization_akan291/WebApp$ python3 -m http.server 8080

3. Go to the Browser and open the below link 
    http://localhost:9000/










