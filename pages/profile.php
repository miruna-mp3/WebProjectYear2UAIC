<?php
    $additionalCss = '<link rel="alternative stylesheet" href="../css/profile.css">';
    $scriptSource = '<script src="../js/profile.js"></script>';
    include '../includes/header.php';
?>
<div class="container">
    <div class="main">
        <div class="navbar">
            <button onclick="showPanel('profile')">Profile</button>
            <button onclick="showPanel('friends')">Friend List</button>
            <button onclick="showPanel('queries')">Saved Queries</button>
            <button onclick="showPanel('results')">Saved Results</button> <!--- Nu este implementat inca --->
            <button onclick="showPanel('button')">Run Script</button>
        </div>
        <div class="workspace" id="workspace">
            <div class="panel" id="profile-panel">
                <!-- Adauga ceva ca sa faci sa nu fie vizibil profilul sau ceva de genul -->
                <div class="left-side">
                    <div id="profileDisplay">
                        <h2>Profile</h2>
                        <ul class="settings">
                            <li><strong>Username:</strong> <span id="displayUsername"></span></li>
                            <li><strong>Email:</strong> <span id="displayEmail"></span></li>
                            <li><strong>First Name:</strong> <span id="displayFirstName"></span></li>
                            <li><strong>Last Name:</strong> <span id="displayLastName"></span></li>
                            <li><strong>Telephone Number:</strong> <span id="displayPhoneNumber"></span></li>
                            <li><strong>Address:</strong> <span id="displayAddress"></span></li>
                            <li><strong>Country:</strong> <span id="displayCountry"></span></li>
                            <li><strong>City:</strong> <span id="displayCity"></span></li>
                        </ul>
                    </div>
                    <form class="settings" id="profileForm">
                        <h2>Edit Profile</h2>
                        <span>
                            <label for="username">Username</label>
                            <input type="text" name="username" id="username" placeholder="enter username">
                        </span>
                        <span>
                            <label for="email">Email</label>
                            <input type="text" name="email" id="email" placeholder="enter email">
                        </span>
                        <div class="doubleInput">
                            <span>
                                <label for="firstName">First Name</label>
                                <input type="text" name="firstName" id="firstName" placeholder="enter first name">
                            </span>
                            <span>
                                <label for="lastName">Last Name</label>
                                <input type="text" name="lastName" id="lastName" placeholder="enter last name">
                            </span>
                        </div>

                        <span>
                            <label for="phoneNumber">Telephone Number</label>
                            <input type="text" name="phoneNumber" id="phoneNumber" placeholder="enter telephone number">
                        </span>
                        <span>
                            <label for="address">Address</label>
                            <input type="text" name="address" id="address" placeholder="enter address">
                        </span>
                        <div class="doubleInput">
                            <span>
                                <label for="country">Country</label>
                                <input type="text" name="country" id="country" placeholder="enter country">
                            </span>
                            <span>
                                <label for="city">City</label>
                                <input type="text" name="city" id="city" placeholder="enter city">
                            </span>
                        </div>
                    </form>
                </div>
                <div class="right-side">
                    <div class="card">
                        <img src="../profil.jpg" class="image">
                        <p id="profileName">FirstName + LastName</p>
                        <p id="profileEmail">Email</p>
                    </div>
                    <div id="profileDisplayButtons">
                        <button type="button" id="editProfileBtn">Edit</button>
                        <button type="button" id="deleteAccountBtn">Delete Account</button>
                        <div id="messageProfileDelete"></div>
                    </div>
                    <div id="formEditProfileButtons">
                        <button type="submit" form="profileForm">Save Profile</button>
                        <div id="messageProfileSave"></div>
                        <button type="button" id="cancelProfileBtn">Cancel Edit</button>
                    </div>
                </div>
            </div>

            <div class="panel" id="friends-panel" style="display:none;">
                <div class="list">
                    <h2>Friend List</h2>
                    <ul id="friendList">

                    </ul>
                </div>
                <div class="requests">
                    <h2>Friend Requests</h2>
                    <ul id="friendRequests">

                    </ul>
                </div>
            </div>
        
            <div class="panel" id="queries-panel" style="display:none;">
                <div style="display: flex; justify-content:center;">
                    <h2>Saved Queries:</h2>
                    <div id="numberQueries" style="margin: 3px 0 0 12px; font-family: 'Segoe UI', Arial, sans-serif; font-size=1.25em; font-weight:400;"></div>
                </div>
                <ul id="queriesList">
                </ul>
            </div>

            <div class="panel" id="results-panel" style="display:none;">

            </div>
            <div class="panel", id="button-panel", style="display:none;">
                <button onclick="runScript()" style="padding: 6px;">Run Script</button>
                <div id="result"></div>
            </div>
        </div>
    </div>
</div>
<?php
    include '../includes/footer.php';
?>
