using Microsoft.EntityFrameworkCore;

namespace Benday.Testing.Api;

public class MyDbContext : DbContext
{
 public MyDbContext(DbContextOptions options) : base(options)
 {
 }

  public DbSet<Person> Persons { get; set; }
}
