# task for dir 
1. resolve possible racing condition 
2. create conditions to improve download performance. ex: 
    - Available RAM memory: Download the model directly to RAM and write everything at once to the SSD.
    - RAM memory is tight, split the write process into 2 tasks on the SSD.
    - Small RAM memory, divided into small buffers, or everything directly on the SSD.
