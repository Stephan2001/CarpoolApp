using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using VCCarpoolingAPI.Models;
using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.FileProviders;

namespace VCCarpoolingAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Configure settings from appsettings.json
            builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
            var jwtSettingsSection = builder.Configuration.GetSection("Jwt");
            builder.Services.Configure<JwtSettings>(jwtSettingsSection);

            //bruteforce protection
            builder.Services.AddMemoryCache();

            // Add services to the container.
            builder.Services.AddSingleton<BlobStorageService>();
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
                {
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            builder.Services.AddDbContext<VarsityCollegeCarpoolingContext>(options =>
            {
                options.UseSqlServer(builder.Configuration.GetConnectionString("DBConnection"));
            });

            builder.Services.AddSingleton<Encryption>();

            // Configure CORS - remove the duplicate
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigins",
                    builder =>
                    {
                        builder.WithOrigins("http://localhost:3000", "websiteurl") // React app URL (development and production)
                               .AllowAnyHeader()
                               .AllowAnyMethod();
                    });
            });

            // JWT services
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(builder.Configuration["Jwt:SecretKey"]))
                };
            });

            var connectionString = builder.Configuration["AzureServiceBus:ConnectionString"];
            var topicName = builder.Configuration["AzureServiceBus:TopicName"];

            builder.Services.AddSingleton(serviceProvider => {
                return new ServiceBusClient(connectionString);
            });

            builder.Services.AddSingleton(serviceProvider => {
                var client = serviceProvider.GetRequiredService<ServiceBusClient>();
                return client.CreateSender(topicName);
            });
            builder.Services.AddAuthentication();
            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // Ensure correct order of middleware
            app.UseCors("AllowSpecificOrigins");
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
