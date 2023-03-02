console.log(
    "%cWARNING :3",
    "color:red; font-size: 50px; font-weight: bold;",
    "\nUsing extrnal scripts to gain a unfair advantage will result in a ban."
)

let log = console.log
function print(){
    log(arguments[0])
}

console.screen = function(){

    let text = document.createElement("p")
    text.innerText = arguments[0]

    document.getElementById("devConsole").appendChild(text)

    // fade opacity after 2 seconds
    setTimeout(() => {
        
        // add fade out animation
        text.classList.add("fadeOut")
        setTimeout(() => {
            // remove element
            text.remove()
        },1000)

    }, 5000);

}
