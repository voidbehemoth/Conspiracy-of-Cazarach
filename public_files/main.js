// This code only executes after the document has finished loading.
// You can also have MULTIPLE document.ready functions 
$(document).ready(function(){
  console.log("main.js loaded");
  

  const socket = io();

  socket.on("connection", function(){
    console.log("I am connected to the server!");
    
  })

  socket.on("zero games", function(){
    console.log("Failed to join a game, as there are no active games");
    alert("Failed to join a game, as there are no active games")
  })

  socket.on("ingame", function(gameID){
    console.log(`Unable to join a game as the user is already in a game`);
  })

  socket.on("create_ingame", function(gameID){
    console.log(`Unable to create a new game as the user is already in a game`);
  })

  socket.on("game full", function(gameID){
    console.log(`Unable to join game number ${gameID}, as it was full`);
  })

  socket.on("join success", function(gameID){
    console.log(`Successfully joined game number ${gameID}`);
  })

  socket.on("create success", function(gameID){
    console.log(`Successfully created and joined game number ${gameID}`);
  })

  socket.on("left game", function(gameID){
    console.log(`Successfully left game number ${gameID}`);
  })

  socket.on("chat message", function(message){
    if(message==="hide jumbotron"){
      $("#title").fadeToggle();
    }
  })


  // If I want to attach an event handler to a click event, I do the following:
  $("#btn-join").click(function(){
    console.log("Button got clicked!");
    // to fade out an element in jQuery, use the fadeOut() function
    socket.emit("join game")
  })

  $("#btn-new-game").click(function(){
    console.log("Button got clicked!");
    // to fade out an element in jQuery, use the fadeOut() function
    socket.emit("new game", "classic", 15)
  })

  $("#btn-exit").click(function(){
    console.log("Button got clicked!");
    // to fade out an element in jQuery, use the fadeOut() function
    if (confirm("Do you really want to leave this game?")) {
      socket.emit("leave game")
    }
  })

  $("#send-chat").click(function(){
    const message = $("#chat-message").val();
    $("#chat-message").val("");
    socket.emit("chat message", message)
  })
});