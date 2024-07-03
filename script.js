var menuUL = document.getElementsByTagName("ul");
		var heightOful = menuUL[0].scrollHeight;
		var btnToggle = document.getElementsByClassName("btn-toggle");
		btnToggle[0].addEventListener("click",function(){
			if(menuUL[0].style.maxHeight){
				menuUL[0].style.maxHeight = null;
			}
			else{
				menuUL[0].style.maxHeight = menuUL[0].scrollHeight + "px";
			}
		});



        function showSidebar() {
            const sidebar = document.querySelector(".sidebar");
            sidebar.style.display = 'flex';
            setTimeout(() => {
                sidebar.style.transform = 'translateX(0)'; 
            }, 10);
        }
        
        function closeSidebar() {
            const sidebar = document.querySelector(".sidebar");
            sidebar.style.transform = 'translateX(100%)'; 
            setTimeout(() => {
                sidebar.style.display = 'none';
            }, 300);
        }



        $(".card-toggle").on("click", function(){
	
            // Card toggle state 	
            $(".card-toggle").removeClass("active");
            $(this).addClass("active");
            
            var isAnimating = false;
            
            if( !isAnimating ){
                isAnimating = true;
                
                $(".card").find(".card-content").css("z-index",0);
                $(".card").removeClass("active");
        
                var that = $(this);
        
                $(this).siblings().css("z-index",1);
        
                setTimeout(function(){
                    that.parent().toggleClass("active").find(".card-content").on("transitionend", function(){
                        isAnimating = false;
                    });	;
                    
                },10);
            } else {
                return;
            }
        });
        
        $("input,textarea").blur(function(){
            if( $(this).val() ){
                $(this).parent().addClass("filled");
            } else {
                $(this).parent().removeClass("filled");
            }
        });
        
        $(".contact").on("click",function(){
            $(".contact-form").toggleClass("active");
        });
        $(".contact-form input[type=submit], .contact-form .close").on("click",function(e){
            e.preventDefault();
            $(".contact-form").toggleClass("active")
        });